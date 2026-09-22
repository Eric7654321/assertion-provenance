#!/usr/bin/env python3
"""Constructed known-answer benchmark for the frozen P0/P1/P3/P4 criterion."""
import json
from collections import Counter, defaultdict

import common
import precision_study as ps
import provenance as prov


CASES = [
    # P0: directly stated or entailed by an explicit precondition.
    ("p0_favorite_count", "P0", "Initial favorite count is 0; after one favorite, the count becomes 1.",
     "When the user favorites the article\nThen the favorite count changes from 0 to 1",
     "expect(favoriteCount).toHaveText('1')", "await favorite.click();\n▶ expect(favoriteCount).toHaveText('1');"),
    ("p0_updated_title", "P0", "After submitting an edited title, the article page displays the new title.",
     "When the edited title is submitted\nThen the updated title is displayed",
     "expect(title).toHaveText(updatedTitle)", "await submit.click();\n▶ expect(title).toHaveText(updatedTitle);"),
    ("p0_removed_tags", "P0", "After editing the article to remove all tags, no tags are displayed.",
     "When all tags are removed and the edit is submitted\nThen the tags no longer appear",
     "expect(tags).toHaveCount(0)", "await submit.click();\n▶ expect(tags).toHaveCount(0);"),
    ("p0_nonauthor_control", "P0", "A non-author cannot see the article edit control.",
     "Given a non-author views the article\nThen the edit control is not visible",
     "expect(editControl).not.toBeVisible()", "await page.goto(articleUrl);\n▶ expect(editControl).not.toBeVisible();"),
    ("p0_login_error", "P0", "Submitting a wrong password displays an error message.",
     "When a wrong password is submitted\nThen an error message is displayed",
     "expect(errorMessage).toBeVisible()", "await submit.click();\n▶ expect(errorMessage).toBeVisible();"),

    # P1: intentionally absent from the requirement and present only in Gherkin.
    ("p1_page_url", "P1", "Selecting page 2 displays the subsequent articles.",
     "When page 2 is selected\nThen subsequent articles are displayed\nAnd the URL contains page=2",
     "expect(page).toHaveURL(/page=2/)", "await pageTwo.click();\n▶ expect(page).toHaveURL(/page=2/);"),
    ("p1_exact_page_count", "P1", "The article count follows the pagination setting.",
     "Then page 2 displays exactly 5 articles",
     "expect(previews).toHaveCount(5)", "await pageTwo.click();\n▶ expect(previews).toHaveCount(5);"),
    ("p1_signin_link", "P1", "A visitor cannot post a comment.",
     "Given a visitor views the article\nThen a Sign in link is displayed instead of the comment form",
     "expect(signInLink).toBeVisible()", "await page.goto(articleUrl);\n▶ expect(signInLink).toBeVisible();"),
    ("p1_empty_feed", "P1", "After unfollowing the author, their articles disappear from the feed.",
     "Then the author's articles disappear\nAnd an empty-feed message is displayed",
     "expect(emptyFeedMessage).toBeVisible()", "await unfollow.click();\n▶ expect(emptyFeedMessage).toBeVisible();"),
    ("p1_profile_count", "P1", "Favoriting an article updates its favorite state.",
     "Then the profile favorites tab contains one article",
     "expect(profileFavorites).toHaveCount(1)", "await page.goto(profileUrl);\n▶ expect(profileFavorites).toHaveCount(1);"),

    # P3: pre-action guards whose visibility is claimed by neither artifact.
    ("p3_submit_guard", "P3", "Submitting the edit updates the title.",
     "When the edit is submitted\nThen the title is updated",
     "expect(submit).toBeVisible()", "▶ expect(submit).toBeVisible();\nawait submit.click();"),
    ("p3_delete_guard", "P3", "Deleting an article removes it from the list.",
     "When the article is deleted\nThen it no longer appears in the list",
     "expect(deleteButton).toBeVisible()", "▶ expect(deleteButton).toBeVisible();\nawait deleteButton.click();"),
    ("p3_page_two_guard", "P3", "Selecting page 2 displays subsequent articles.",
     "When page 2 is selected\nThen subsequent articles are displayed",
     "expect(pageTwo).toBeVisible()", "▶ expect(pageTwo).toBeVisible();\nawait pageTwo.click();"),
    ("p3_comment_guard", "P3", "Submitting a comment displays the comment.",
     "When the comment is submitted\nThen the comment appears",
     "expect(commentInput).toBeVisible()", "▶ expect(commentInput).toBeVisible();\nawait commentInput.fill(body);"),
    ("p3_favorite_guard", "P3", "Favoriting increments the count from 0 to 1.",
     "When the article is favorited\nThen the count changes from 0 to 1",
     "expect(favoriteButton).toBeEnabled()", "▶ expect(favoriteButton).toBeEnabled();\nawait favoriteButton.click();"),

    # P4: observable post-action claims constructed to be absent from both artifacts.
    ("p4_hash_route", "P4", "Submitting an article edit displays the updated title.",
     "When the edit is submitted\nThen the updated title is displayed",
     "expect(page).toHaveURL(/#\\/editor\\/.+/)", "await submit.click();\n▶ expect(page).toHaveURL(/#\\/editor\\/.+/);"),
    ("p4_wrong_count", "P4", "The article count follows the pagination setting.",
     "When page 2 is selected\nThen subsequent articles are displayed",
     "expect(previews).toHaveCount(11)", "await pageTwo.click();\n▶ expect(previews).toHaveCount(11);"),
    ("p4_fixed_order", "P4", "Page 2 displays articles subsequent to page 1.",
     "When page 2 is selected\nThen subsequent articles are displayed",
     "expect(titles).toEqual(['C', 'B', 'A'])", "const titles = await headings.allTextContents();\n▶ expect(titles).toEqual(['C', 'B', 'A']);"),
    ("p4_accessible_name", "P4", "After selecting page 2, subsequent articles are displayed.",
     "When page 2 is selected\nThen subsequent articles are displayed",
     "expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible()",
     "await pageTwo.click();\n▶ expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();"),
    ("p4_exact_error_text", "P4", "Submitting a duplicate email displays an error.",
     "When registration uses an existing email\nThen an error is displayed",
     "expect(errorMessage).toHaveText('email has already been taken')",
     "await submit.click();\n▶ expect(errorMessage).toHaveText('email has already been taken');"),
]


def main():
    budgets = {tag: common.Budget() for tag in ps.JUDGES}
    results = []
    for case_id, expected, requirement, feature, assertion, context in CASES:
        row = {"id": case_id, "expected": expected, "decisions": {}}
        for tag, model in ps.JUDGES.items():
            decision = prov.classify(requirement, feature, assertion, budgets[tag],
                                     model=model, context=context)
            row["decisions"][tag] = decision
        results.append(row)
        print(case_id, expected,
              " ".join(f"{tag}={row['decisions'][tag]['class']}" for tag in ps.JUDGES),
              flush=True)

    for tag in ps.JUDGES:
        matrix = defaultdict(Counter)
        for row in results:
            matrix[row["expected"]][row["decisions"][tag]["class"]] += 1
        correct = sum(row["decisions"][tag]["class"] == row["expected"] for row in results)
        print(f"\n{tag}: {correct}/{len(results)}")
        for expected in ("P0", "P1", "P3", "P4"):
            print(expected, dict(matrix[expected]))

    out = common.RUNS / "provenance-benchmark.json"
    out.write_text(json.dumps({"cases": results,
                               "budgets": {k: v.asdict() for k, v in budgets.items()}},
                              ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
