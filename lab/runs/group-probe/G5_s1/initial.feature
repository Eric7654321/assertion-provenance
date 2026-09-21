Feature: Conduit Acceptance Tests

  @item:H01
  Scenario: Article tags and editing
    Given I am a logged-in user on the new article page
    When I publish an article with a title, body, and three tags
    Then the article page shows content matching what was entered
    When I choose to edit the article on its page
    And I change the title to a different string, remove all tags, and submit
    Then the article title is updated
    And the tags no longer appear

  @item:S02
  Scenario: Registration with duplicate email
    Given a user has completed registration with an unused email and logged out
    When someone attempts to register again with the same email
    Then the registration fails with an error displayed
    And the user is not logged in

  @item:H03
  Scenario: Pagination under tag filter
    Given there are 15 articles under a specific tag
    When I filter by this tag on the home page
    Then the number of articles per page matches the pagination setting
    When I select page 2 in the pagination bar
    Then the second page displays the consecutive articles
    And the URL reflects the current page number
    When I open a new page directly with the URL containing page=2
    Then I arrive at the same page
    When I switch back to the all articles list
    Then the list returns to the first page

  @item:S07
  Scenario: Author deletes their own article
    Given I am on my own article page as the author
    When I choose to delete the article
    Then the article no longer appears in the article list on the home page

  @item:H02
  Scenario: Article page visibility and permissions
    Given an author creates an article and posts a comment on it
    When an unauthenticated guest views the article page
    Then the guest can view the article but cannot post comments
    When another logged-in user who is not the author views the same article page
    Then this user does not see controls to edit or delete the article
    When this user posts their own comment on the article
    Then delete controls for comments only appear to the respective authors of those comments

  @item:S09
  Scenario: Visibility of comment deletion control
    Given User A has posted a comment on an article
    When User B views the same article and posts their own comment
    Then User B does not see the delete control for User A's comment
    And User B sees the delete control for their own comment

  @item:H04
  Scenario: Follow and unfollow
    Given User B views Author A's profile page
    When User B chooses to follow Author A
    Then the follow button changes to an unfollow state
    When User B goes to the home page and switches to "Your Feed"
    Then Author A's articles appear in "Your Feed"
    When User B returns to Author A's profile page and chooses to unfollow Author A
    Then the button returns to its original state
    When User B switches to "Your Feed" again
    Then Author A's articles no longer appear
    And an empty state is displayed when there are no articles in "Your Feed"

  @item:S10
  Scenario: Favorite an article
    Given I view an un-favorited article with an initial favorite count of 0
    When I choose to favorite the article
    Then the favorite button changes to an un-favorite state
    And the favorite count changes from 0 to 1

  @item:S03
  Scenario: Login with incorrect password
    Given I am on the login page
    When I submit a registered email with an incorrect password
    Then I remain on the login page
    And an error message is displayed

  @item:S12
  Scenario: Article list pagination
    Given I scroll to the pagination bar in the article list on the home page
    When I select page 2
    Then the list displays the consecutive articles
