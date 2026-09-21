Feature: Conduit Acceptance Tests

  @item:H01
  Scenario: Article tags and editing
    Given a logged-in user is on the new article page
    When the user publishes an article with a title, body, and three tags
    Then the article page displays content matching the input
    When the user edits the article from the article page
    And changes the title to another string, removes all tags, and submits
    Then the article page displays the updated title
    And no tags appear on the article page

  @item:S02
  Scenario: Registration with duplicate email
    Given a user completes registration with an unused email
    And logs out
    When the user registers again with the same email
    Then the registration fails with an error displayed
    And the user is not logged in

  @item:H03
  Scenario: Pagination with tag filter
    Given there are 15 articles under a specific tag
    When a user filters articles by this tag on the home page
    Then the number of displayed articles matches the pagination setting
    When the user selects page 2 from the pagination controls
    Then the second page shows the subsequent articles
    And the URL reflects page 2
    When the user directly opens the URL with page 2
    Then the user arrives at the same page
    When the user switches back to the all articles list
    Then the list returns to the first page

  @item:S07
  Scenario: Author deletes own article
    Given an author opens their own article page
    When the author deletes the article
    Then the article no longer appears in the article list on the home page

  @item:H02
  Scenario: Article page visibility and permissions
    Given an author creates an article and posts a comment on it
    When an unauthenticated visitor opens the article page
    Then the visitor can see the article but cannot post a comment
    When another logged-in user who is not the author opens the article page
    Then the user does not see the controls to edit or delete the article
    And the user does not see the delete control for the author's comment
    When this user posts a comment on the article
    Then the user sees the delete control only for their own comment

  @item:S09
  Scenario: Comment deletion visibility
    Given user A posts a comment on an article
    When user B opens the same article and posts their own comment
    Then user B cannot see the delete control for user A's comment
    And user B can see the delete control for their own comment

  @item:H04
  Scenario: Follow and unfollow
    When user B opens author A's profile page and follows author A
    Then the follow button switches to an unfollow state
    When user B goes to the home page and switches to "Your Feed"
    Then author A's articles appear in "Your Feed"
    When user B returns to author A's profile page and unfollows author A
    Then the button returns to its original follow state
    When user B switches to "Your Feed" again
    Then author A's articles no longer appear in "Your Feed"
    And "Your Feed" displays an empty state when there are no articles

  @item:S10
  Scenario: Favorite an article
    Given a user opens an article that has not been favorited and has 0 favorites
    When the user favorites the article
    Then the button switches to an unfavorited state
    And the favorite count changes from 0 to 1

  @item:S03
  Scenario: Login with incorrect password
    Given a user is on the login page
    When the user submits a registered email and an incorrect password
    Then the user remains on the login page
    And an error message is displayed

  @item:S12
  Scenario: Article list pagination
    Given a user views the article list on the home page and scrolls to the pagination controls
    When the user selects page 2
    Then the subsequent articles are displayed
