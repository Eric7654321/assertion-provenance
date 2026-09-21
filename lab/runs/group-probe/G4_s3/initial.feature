Feature: Conduit Acceptance Tests

  @item:H01
  Scenario: Article tagging and editing
    Given a logged-in user is on the new article page
    When the user fills in the title and body, adds three tags, and publishes the article
    Then the article page content matches the input
    When the user clicks edit on the article page
    And the user changes the title to another string, removes all tags, and submits
    Then the article page is updated accordingly

  @item:S02
  Scenario: Registration with duplicate email
    Given a user completes registration with an unused email
    And the user logs out
    When the user registers again with the same email
    Then the second registration is not successful

  @item:H03
  Scenario: Pagination for tag filtering
    Given there are 15 articles under a specific tag
    When the user filters by that tag on the home page
    And the user clicks page 2 in the pagination bar
    Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
    When the user opens another page and directly enters the URL with page=2
    Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
    When the user switches back to the all articles list
    Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly

  @item:S07
  Scenario: Author deletes their own article
    Given the author opens their own article page
    When the author clicks to delete the article
    Then the article disappears from the list after deletion

  @item:H02
  Scenario: Article page visibility and permissions
    Given an author creates an article and leaves a comment on it
    When an unauthenticated visitor opens the article page
    Then what is visible and the available actions differ based on the role
    When another logged-in, non-author user opens the same page
    And this user leaves their own comment on the page
    Then what is visible and the available actions differ based on the role

  @item:S09
  Scenario: Visibility of comment deletion
    Given user A leaves a comment on an article
    When user B opens the same article and leaves their own comment
    Then deleting a comment is only available for one's own comment

  @item:H04
  Scenario: Follow and unfollow
    Given user B opens author A's profile page and clicks follow
    When user B returns to the home page and switches to Your Feed
    Then the button and Your Feed reflect the followed state
    When user B returns to author A's profile page and clicks unfollow
    And user B switches to Your Feed again
    Then the state returns to the original state

  @item:S10
  Scenario: Favorite article
    Given an article has an initial favorite count of 0 and has not been favorited
    When the user opens the article and clicks to favorite it
    Then the button and the count reflect this action

  @item:S03
  Scenario: Login with incorrect password
    Given the user is on the login page
    When the user enters a registered email and an incorrect password, and submits
    Then the login is not successful and the screen notifies the user

  @item:S12
  Scenario: Article list pagination
    Given the user is on the article list on the home page
    When the user scrolls to the pagination bar and clicks page 2
    Then different articles are displayed after changing the page
