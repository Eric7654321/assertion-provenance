Feature: Conduit Acceptance Criteria

  @item:H01
  Scenario: Article tags and editing
    Given a logged-in user is on the new article page
    When the user fills in a title and body, adds three tags, and publishes the article
    Then the article page should display content matching the input
    When the user edits the article from the article page
    And changes the title to another string, removes all tags, and submits
    Then the updated title should be displayed
    And the tags should no longer appear

  @item:S02
  Scenario: Registration with duplicate email
    Given a user has registered with an unused email
    And has logged out
    When the user attempts to register again with the same email
    Then the registration should fail with an error displayed
    And the user should not be logged in

  @item:H03
  Scenario: Tag-filtered pagination
    Given there are 15 articles under a specific tag
    When the user filters by that tag on the home page
    Then the number of articles per page should match the pagination settings
    When the user selects page 2 from the pagination controls
    Then the articles displayed should be the continuation of the list
    And the URL should reflect the current page number
    When the user directly navigates to the URL with page=2 in a new page
    Then the user should arrive at the same page
    When the user switches back to the all articles list
    Then the list should return to page 1

  @item:S07
  Scenario: Author deletes own article
    Given an author opens their own article page
    When the author deletes the article
    Then the article should no longer appear in the article list on the home page

  @item:H02
  Scenario: Article page visibility and permissions
    Given an author creates an article and leaves a comment on it
    When an unauthenticated visitor opens the article page
    Then the visitor can see the article but cannot leave a comment
    When another logged-in user who is not the author opens the article page
    Then the user should not see the edit and delete controls for the article
    When this user leaves their own comment on the article page
    Then the delete control for a comment should only appear to the author of that comment

  @item:S09
  Scenario: Comment deletion control visibility
    Given user A leaves a comment on an article
    When user B opens the same article and leaves their own comment
    Then user B should not see the delete control for user A's comment
    And user B should see the delete control for their own comment

  @item:H04
  Scenario: Follow and unfollow author
    Given user B opens author A's profile page
    When user B follows author A
    Then the follow button should change to an unfollow state
    When user B returns to the home page and switches to Your Feed
    Then author A's articles should appear in Your Feed
    When user B returns to author A's profile page and unfollows author A
    Then the button should return to its original state
    When user B switches to Your Feed again
    Then author A's articles should no longer appear
    And Your Feed should display an empty state when there are no articles

  @item:S10
  Scenario: Favorite an article
    Given a user opens an article that has not been favorited and has an initial favorite count of 0
    When the user favorites the article
    Then the favorite button should change to an unfavorite state
    And the favorite count should change from 0 to 1

  @item:S03
  Scenario: Login with incorrect password
    Given a user is on the login page
    When the user enters a registered email and an incorrect password, and submits
    Then the user should remain on the login page
    And an error message should be displayed

  @item:S12
  Scenario: Article list pagination
    Given a user scrolls to the pagination controls on the home page article list
    When the user selects page 2
    Then the articles displayed should be the continuation of the list
