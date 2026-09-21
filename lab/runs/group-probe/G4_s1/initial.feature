Feature: Conduit Acceptance Requirements

  @item:H01
  Scenario: Article tagging and editing
    Given a user is logged in
    And the user goes to the new article page
    When the user fills in the title and body, adds three tags, and publishes the article
    Then the article page content should match the entered information
    When the user clicks edit on the article page
    And the user changes the title to a different string, removes all tags, and submits
    Then the article page should update accordingly

  @item:S02
  Scenario: Registration with a duplicate email
    Given a user completes registration with an unused email
    And the user logs out
    When the user attempts to register again with the same email
    Then the second registration should not succeed

  @item:H03
  Scenario: Tag filtering pagination
    Given there are 15 articles under a specific tag
    When the user filters by that tag on the home page
    And the user clicks page 2 in the pagination bar
    Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
    When the user opens a new page and directly enters the URL with page=2
    Then the pagination behavior should match the configuration, showing subsequent articles
    When the user switches back to the all articles list
    Then the pagination behavior should match the configuration

  @item:S07
  Scenario: Author deletes their own article
    Given an author opens their own article page
    When the author clicks delete article
    Then the article should disappear from the list

  @item:H02
  Scenario: Article page visibility and permissions
    Given an author creates an article and leaves a comment under it
    When an unauthenticated visitor opens the article page
    Then what the visitor sees and the actions they can perform should differ based on their role
    When another logged-in user who is not the author opens the same page
    And this user leaves their own comment on the page
    Then what this user sees and the actions they can perform should differ based on their role

  @item:S09
  Scenario: Comment deletion visibility
    Given User A leaves a comment on an article
    When User B opens the same article and leaves their own comment
    Then deleting a comment should only be possible for one's own comment

  @item:H04
  Scenario: Follow and unfollow
    Given User B opens Author A's profile page and clicks follow
    When User B goes to the home page and switches to Your Feed
    Then the button and Your Feed should reflect this state
    When User B returns to Author A's profile page and clicks unfollow
    And User B switches to Your Feed again
    Then the state should return to what it was originally

  @item:S10
  Scenario: Favorite an article
    Given an article has an initial favorite count of 0 and has not been favorited
    When the user opens the article and clicks favorite
    Then the button and the count should reflect this action

  @item:S03
  Scenario: Login with incorrect password
    Given a user enters a registered email and an incorrect password on the login page
    When the user submits the form
    Then the login should not succeed and the page should inform the user

  @item:S12
  Scenario: Article list pagination
    Given the user scrolls to the pagination bar on the home page article list
    When the user clicks page 2
    Then the user should see different articles after changing the page
