Feature: Conduit Acceptance Requirements

  @item:H01
  Scenario: Article tagging and editing
    Given a user is logged in
    And the user is on the new article page
    When the user enters a title, body, and adds three tags, and publishes the article
    Then the article page content should match the entered information
    When the user selects edit on the article page
    And the user changes the title to a different string, removes all tags, and submits
    Then the article page should update accordingly

  @item:S02
  Scenario: Registration with duplicate email
    Given a user completes registration with an unused email
    And the user logs out
    When the user registers again with the same email
    Then the second registration should not succeed

  @item:H03
  Scenario: Tag filter pagination
    Given there are 15 articles under a specific tag
    When the user filters by that tag on the home page
    And selects page 2 from the pagination bar
    Then subsequent articles should be visible
    And the URL should reflect the change
    When the user opens a new page and navigates directly to the URL with page=2
    Then subsequent articles should be visible
    When the user switches back to the all articles list
    Then the pagination behavior should meet expectations

  @item:S07
  Scenario: Author deletes own article
    Given the author opens their own article page
    When the author clicks delete article
    Then the article should disappear from the list

  @item:H02
  Scenario: Article page visibility and permissions
    Given a user creates an article and posts a comment under the article as its author
    When a guest who is not logged in opens the article page
    Then the guest should see content and available actions appropriate for an unauthenticated visitor
    When another logged-in user who is not the author opens the same article page
    Then that user should see content and available actions appropriate for a non-author logged-in user
    When that user posts their own comment on the same page
    Then the displayed content and available actions should reflect different roles on the same page

  @item:S09
  Scenario: Visibility of comment deletion
    Given user A posts a comment on an article
    When user B opens the same article and posts their own comment
    Then deleting a comment should only be possible for one's own comment

  @item:H04
  Scenario: Follow and unfollow
    Given user B opens author A's profile page and clicks follow
    When user B returns to the home page and switches to Your Feed
    Then the follow button and Your Feed should reflect the followed state
    When user B returns to author A's profile page and clicks unfollow
    And switches to Your Feed again
    Then the follow button and Your Feed should revert to their original state

  @item:S10
  Scenario: Favorite an article
    Given an article with an initial favorite count of 0 is opened and not yet favorited
    When the user clicks favorite
    Then the button and count should reflect the action

  @item:S03
  Scenario: Login with incorrect password
    Given the user is on the login page
    When the user enters a registered email and an incorrect password and submits
    Then login should not succeed
    And the screen should notify the user

  @item:S12
  Scenario: Article list pagination
    Given the user scrolls to the pagination bar on the home page article list
    When the user clicks page 2
    Then different articles should be displayed after changing pages
