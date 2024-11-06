/*
 * Name: Louisa Chen, Sophia Tang
 * Date: Nov 1, 2023
 * Section: CSE 154 AF, AD
 * This is the index.js page for index.html. It handles all the functionalities in index.html
 * relating to the course regisration site.
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  let USERID = 0;

  /**
   * Initializes the script by setting up event listeners for menu button and search option.
   */
  function init() {
    id('search-btn').addEventListener('click', handleSearchBtnClick);
    id('search-term').addEventListener('input', handleSearchTermInput);
    id('login').querySelector('form')
      .addEventListener('submit', function(event) {
        handleLoginFormSubmit(event);
      });
    id('profile-btn').addEventListener('click', handleProfileBtnClick);
    id('find-course-btn').addEventListener('click', searchView);
    id('home-btn').addEventListener('click', homeView);
    id('cart-btn').addEventListener('click', handleCartBtnClick);
    id('back-btn').addEventListener('click', searchView);
    id('register-btn').addEventListener('click', handleRegisterBtnClick);
  }

  document.addEventListener("DOMContentLoaded", function() {
    id('switch-btn').addEventListener('click', function() {
      id('profile-container').classList.toggle('layout-flex');
    });
  });

  /**
   * Handles the click event of the profile button.
   */
  function handleProfileBtnClick() {
    switchView(
      id('profile'),
      id('login'),
      id('course'),
      id('home'),
      id('search'),
      id('cart'),
      id('error')
    );
  }

  /**
   * switches the view to find course.
   */
  function searchView() {
    switchView(
      id('search'),
      id('login'),
      id('course'),
      id('home'),
      id('profile'),
      id('cart'),
      id('error')
    );
  }

  /**
   * switches the view for specific course.
   */
  function courseView() {
    switchView(
      id('course'),
      id('login'),
      id('search'),
      id('home'),
      id('profile'),
      id('cart'),
      id('error')
    );
  }

  /**
   * Switches to home view.
   */
  function homeView() {
    switchView(
      id('home'),
      id('login'),
      id('course'),
      id('search'),
      id('profile'),
      id('cart'),
      id('error')
    );
  }

  /**
   * Handles the click event of the search button.
   */
  function handleSearchBtnClick() {
    searchView();
    searchRequest();
  }

  /**
   * Handles the input event of the search term.
   */
  function handleSearchTermInput() {
    let trimmedValue = id('search-term').value.trim();
    id('search-btn').disabled = trimmedValue === '';
  }

  /**
   * Handles the form submit event of the login form.
   * @param {Event} event - The form submit event.
   */
  function handleLoginFormSubmit(event) {
    event.preventDefault();
    loginRequest();
  }

  /**
   * Handles the click event of the cart button.
   */
  function handleCartBtnClick() {
    removeCourseCards(id('registration'), 'registered-courses');
    switchView(
      id('cart'),
      id('login'),
      id('course'),
      id('home'),
      id('profile'),
      id('search'),
      id('error')
    );
    cartRequest(true);
    displayRegistrationRequest();
  }

  /**
   * Handles the click event of the register button.
   */
  function handleRegisterBtnClick() {
    registerRequest();
    removeCourseCards(id('planned-preview'), 'planned-courses');
    removeCourseCards(id('registration'), 'registered-courses');
  }

  /**
   * Requests registration for the selected courses in the cart.
   * Displays success or error messages accordingly.
   */
  async function registerRequest() {
    let courses = await cartRequest(false);
    for (let i = 0; i < courses.length; i++) {
      let params = new FormData();
      params.append('user', USERID);
      params.append('sln', courses[i].sln);
      params.append('code', courses[i].title.slice(0, 3));
      try {
        let response = await fetch('/myplan/user/registration', {method: "POST", body: params});
        await statusCheck(response);
        response = await response.text();
        displayRegistrationRequest();
        let message = gen('p');
        message.textContent = response;
        id('planned-preview').appendChild(message);
        setTimeout(function() {
          id('planned-preview').removeChild(message);
        }, 2000);
      } catch (err) {
        handleRegisterError(err);
      }
    }
  }

  /**
   * Displays the registration details for the user.
   * Retrieves the registered courses from the server and updates the display.
   */
  async function displayRegistrationRequest() {
    try {
      let response = await fetch(`/myplan/user/registered?user=${USERID}`);
      await statusCheck(response);
      response = await response.json();
      displayCourseCards(response, 'registration');
    } catch (err) {
      handleGeneralError();
    }
  }

  /**
   * Handles errors that occur during registration.
   * Displays an error message to the user.
   * @param {Error} err - The error object.
   */
  function handleRegisterError(err) {
    if (err.message !== 'An error occurred on the server. Try again later.') {
      let message = gen('p');
      message.textContent = err.message;
      id('planned-preview').appendChild(message);
      setTimeout(function() {
        id('planned-preview').removeChild(message);
      }, 2000);
    } else {
      handleGeneralError();
    }
  }

  /**
   * Handles general errors that occur during server communication.
   * Switches the view to the error page.
   */
  function handleGeneralError() {
    switchView(
      id('error'),
      id('login'),
      id('course'),
      id('home'),
      id('profile'),
      id('cart'),
      id('search')
    );
  }

  /**
   * Requests the courses in the user's cart and displays them.
   * @param {boolean} display - Indicates whether to display the courses or not.
   * @returns {Array} - An array of planned courses.
   */
  async function cartRequest(display) {
    if (display) {
      try {
        let response = await fetch(`/myplan/user/cart?id=${USERID}`);
        await statusCheck(response);
        response = await response.json();
        removeCourseCards(id('planned-preview'), 'planned-courses');
        displayCourseCards(response, 'planned-preview');
      } catch (err) {
        handleGeneralError();
      }
    } else {
      try {
        let response = await fetch(`/myplan/user/cart?id=${USERID}`);
        await statusCheck(response);
        response = await response.json();
        return response.planned;
      } catch (err) {
        handleGeneralError();
      }
    }
  }

  /**
   * Removes course cards from the specified parent container with the given class name.
   * @param {Element} parent - The parent container element.
   * @param {string} className - The class name of the elements to remove.
   */
  function removeCourseCards(parent, className) {
    if (parent.querySelector(`.${className}`)) {
      let elementsToRemove = parent.querySelectorAll(`.${className}`);
      let elementsArray = Array.from(elementsToRemove);
      elementsArray.forEach(element => {
        parent.removeChild(element);
      });
    }
  }

  /**
   * Displays course cards based on the response data.
   * @param {Object} response - The response data containing planned or registered courses.
   * @param {string} containerId - The ID of the container element to display the course cards.
   */
  function displayCourseCards(response, containerId) {
    let courses;
    if (containerId === 'planned-preview') {
      courses = response.planned;
    } else {
      courses = response.registered;
    }
    for (let i = 0; i < courses.length; i += 2) {
      let card = createCourseCard(courses, i, containerId);
      if (containerId === 'planned-preview') {
        id(containerId).insertBefore(card, id('register-btn'));
      } else {
        id(containerId).appendChild(card);
      }
    }
  }

  /**
   * Creates a course card element based on the course details.
   * @param {Array} courses - An array of courses.
   * @param {number} index - The index of the current course.
   * @param {string} containerId - The ID of the container element to append the course card.
   * @returns {Element} - The course card element.
   */
  function createCourseCard(courses, index, containerId) {
    let card = genWithAttributes(
      'article',
      '',
      containerId === 'planned-preview' ? 'planned-courses' : 'registered-courses'
    );
    let title = genWithAttributes('h3', courses[index].title);
    let credits = genWithAttributes(
      'span',
      courses[index].credits + ' CR',
      containerId === 'planned-preview' ? 'p-credit' : 'r-credit'
    );
    card.appendChild(title);
    card.appendChild(credits);
    card.appendChild(gen('br'));
    appendDetails(card, courses[index], 'Lecture', containerId);
    card.appendChild(gen('br'));
    appendDetails(card, courses[index + 1], 'Quiz', containerId);

    return card;
  }

  /**
   * Appends course details to the course card.
   * @param {Element} card - The course card element.
   * @param {Object} course - The course details.
   * @param {string} type - The type of the course (e.g., Lecture, Quiz).
   * @param {string} containerId - The ID of the container element.
   */
  function appendDetails(card, course, type, containerId) {
    let sectionClass = containerId === 'planned-preview' ? 'p-section' : 'r-section';
    let slnClass = containerId === 'planned-preview' ? 'p-sln' : 'r-sln';
    let typeClass = containerId === 'planned-preview' ? 'p-type' : 'r-type';
    let availClass = containerId === 'planned-preview' ? 'p-avail' : 'r-avail';

    let section = genWithAttributes('span', course.section, sectionClass);
    let sln = genWithAttributes('span', course.sln, slnClass);
    let typeSpan = genWithAttributes('span', type, typeClass);
    let avail = genWithAttributes('span', course.availability, availClass);

    card.appendChild(section);
    card.appendChild(sln);
    card.appendChild(typeSpan);
    if (containerId === 'planned-preview') {
      card.appendChild(avail);
    }
  }

  /**
   * Generates an HTML element with specified attributes.
   * @param {string} tagName - The HTML tag name.
   * @param {string} textContent - The text content of the element.
   * @param {string} className - The class name of the element.
   * @returns {Element} - The generated HTML element.
   */
  function genWithAttributes(tagName, textContent, className) {
    let element = gen(tagName);
    if (textContent) {
      element.textContent = textContent;
    }
    if (className) {
      element.classList.add(className);
    }
    return element;
  }

  /**
   * Requests user login with the provided credentials.
   * Displays success or error messages accordingly.
   */
  async function loginRequest() {
    let params = new FormData();
    let username = id('username').value;
    let password = id('password').value;
    params.append('username', username);
    params.append('password', password);

    try {
      let response = await fetch('/myplan/user/login', {method: "POST", body: params});
      await statusCheck(response);
      response = await response.json();
      updateProfile(response);
      setTimeout(function() {
        qs('.top-navbar').classList.remove('hidden');
        homeView();
      }, 2000);
    } catch (err) {
      handleLoginError();
    }
  }

  /**
   * Handles login errors by displaying an error message to the user.
   */
  function handleLoginError() {
    let message = gen('p');
    message.textContent = "You entered wrong username or password. Please try again.";
    id('login').appendChild(message);
    setTimeout(function() {
      id('login').removeChild(message);
    }, 3000);
  }

  /**
   * Updates the user profile information on successful login.
   * @param {Object} userInfo - The user information.
   */
  function updateProfile(userInfo) {
    let username = gen('h1');
    USERID = userInfo.user;
    username.textContent = userInfo.username;
    id('user-protrait').appendChild(username);
    for (let i = 0; i < userInfo.coursesTaken.length; i++) {
      let course = gen('p'); // Louisa Change li to p
      course.textContent = userInfo.coursesTaken[i];
      qs('.courses-taken').appendChild(course);
    }
  }

  /**
   * Switches the view between main and hidden views.
   * @param {Element} mainView - The main view element.
   * @param {Element} hiddenViews - The hidden view elements.
   */
  function switchView(mainView, ...hiddenViews) {
    if (mainView.classList.contains('hidden')) {
      mainView.classList.remove('hidden');
      hiddenViews.forEach(view => view.classList.add('hidden'));
    }
  }

  /**
   * Requests adding a course to the user's plan based on the selected section.
   * Displays success or error messages accordingly.
   * @param {Element} addBtn - The button element triggering the course addition.
   */
  async function addCourseToPlanRequest(addBtn) {
    let params = new FormData();
    let section = addBtn.closest('tr');
    let code = qs('.course-overview').querySelector('h2').textContent.slice(0, 3);
    params.append('code', code);
    params.append('section', section.querySelector('.section').textContent);
    params.append('id', USERID);

    try {
      let response = await fetch('myplan/course/add', {method: "POST", body: params});
      await statusCheck(response);
      let addedSections = await response.json();
      displayAddCourseMessage(addedSections);
      updateRowState(addBtn);
    } catch (err) {
      handleGeneralError();
    }
  }

  /**
   * Displays a success message after successfully adding a course to the plan.
   * @param {Object} message - The message object containing course and sections information.
   */
  function displayAddCourseMessage(message) {
    let addedSections = '';
    if (message.sections.length === 2) {
      addedSections = message.sections[0] + ' and ' + message.sections[1];
    } else {
      addedSections = message.sections[0];
    }
    let msg = gen('h4');
    msg.textContent = 'Successfully added ' + message.course +
      ` with sections ${addedSections} to the plan!`;
    qs('.course-overview').appendChild(msg);
    setTimeout(function() {
      qs('.course-overview').removeChild(msg);
    }, 3000);
  }

  /**
   * Updates the state of a course row after successfully adding it to the plan.
   * @param {Element} addBtn - The button element used for adding the course.
   */
  function updateRowState(addBtn) {
    let sectionRow = addBtn.closest('tr');
    sectionRow.classList.add('highlighted');
    if (sectionRow.querySelector('.type').textContent === 'Quiz') {
      let rows = qs('.section-info').querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].querySelector('.type').textContent === 'Lecture' &&
          rows[i].querySelector('.section').textContent ===
          sectionRow.querySelector('.section').textContent.charAt(0)) {

          rows[i].classList.add('highlighted');
          rows[i].querySelector('.add-course-btn').remove();

        }
      }
    }
    addBtn.remove();
  }

  /**
   * Initiates a search request based on the provided search term.
   * Displays search results and handles any errors that occur during the request.
   */
  async function searchRequest() {
    try {
      let request;
      if (id('prereq').checked) {
        request = `/myplan/all/none?search=${id('search-term').value.trim()}`;
      } else {
        request = `/myplan/all/yes?search=${id('search-term').value.trim()}`;
      }
      let response = await fetch(request);
      await statusCheck(response);
      let searchedClasses = await response.json();
      id('search-btn').disabled = true;
      populateSearches(searchedClasses.courses);
      for (let code of qsa('.course-code')) {
        code.addEventListener('click', function() {
          courseDetailsRequest(code);
          courseView();
        });
      }
    } catch (err) {
      handleGeneralError();
    }
  }

  /**
   * Populates the search results with the retrieved course information.
   * @param {Array} courses - An array of course information.
   */
  function populateSearches(courses) {
    if (qs('.course-container').classList.contains('hidden')) {
      qs('.course-container').classList.remove('hidden');
    }
    let message = qs('.course-container').querySelector('p');
    qs('.course-info').innerHTML = '';
    if (message) {
      qs('.course-container').removeChild(message);
    }
    if (!courses[0].code) {
      if (!qs('.course-display').classList.contains('hidden')) {
        qs('.course-display').classList.add('hidden');
      }
      let noMatchMsg = gen('p');
      noMatchMsg.textContent = courses;
      qs('.course-container').appendChild(noMatchMsg);
    } else {
      if (qs('.course-display').classList.contains('hidden')) {
        qs('.course-display').classList.remove('hidden');
      }
      addSearchedCourses(courses);
    }
  }

  /**
   * Adds searched courses to the search results table in the UI.
   * @param {Array} courses - An array of course objects containing code, title,
   * quarter, and credits.
   */
  function addSearchedCourses(courses) {
    let tBody = qs(".course-info");
    for (let i = 0; i < courses.length; i++) {
      let courseItem = courses[i];
      let newRow = gen('tr');
      let properties = ['code', 'title', 'quarter', 'credits'];

      properties.forEach(property => {
        let newCell = gen('td');
        newCell.textContent = courseItem[property];
        newCell.classList.add(`course-${property}`);
        newRow.appendChild(newCell);
      });

      newRow.id = courseItem['code'];
      tBody.appendChild(newRow);
    }
  }

  /**
   * Requests and displays detailed information for a selected course.
   * @param {Element} courseName - The course name element clicked by the user.
   */
  async function courseDetailsRequest(courseName) {
    try {
      let response = await fetch('/myplan/courses/' + courseName.textContent);
      await statusCheck(response);
      let courseDetails = await response.json();
      displayCourseDetails(courseDetails);
    } catch (err) {
      handleGeneralError();
    }
  }

  /**
   * Displays detailed information for the selected course.
   * @param {Object} courseDetails - The detailed information about the course.
   */
  function displayCourseDetails(courseDetails) {
    qs('.section-info').innerHTML = '';
    qs('.course-overview').innerHTML = '';
    displayCourseOverview(courseDetails);
    displayCourseInfo(courseDetails.courseInfo);
  }

  /**
   * Displays the course overview information in the UI.
   * @param {Object} courseDetails - An object containing course and courseOverview information.
   */
  function displayCourseOverview(courseDetails) {
    let title = gen('h2');
    title.textContent = courseDetails.course;
    let article = qs('.course-overview');
    article.append(title);
    let courseOverview = courseDetails.courseOverview;
    for (let key in courseOverview) {
      let overview = gen('p');
      overview.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}` +
        ` ${courseOverview[key]}`;
      article.appendChild(overview);
    }
  }

  /**
   * Displays the section information of a course in the UI.
   * @param {Array} sectionInfo - An array of objects containing section information.
   */
  function displayCourseInfo(sectionInfo) {
    for (let i = 0; i < sectionInfo.length; i++) {
      let sectionItem = sectionInfo[i];
      let properties = ['section', 'type', 'instructor',
         'sln', 'availability'];
      let newRow = gen('tr');
      properties.forEach(property => {
        let newCell = gen('td');
        newCell.textContent = sectionItem[property];
        newCell.classList.add(property);
        newRow.appendChild(newCell);
      });
      let btnCell = gen('td');
      let addBtn = gen('button');
      addBtn.textContent = '+';
      addBtn.classList.add('add-course-btn');
      addBtn.addEventListener('click', function() {
        addCourseToPlanRequest(addBtn);
      });

      btnCell.appendChild(addBtn);
      newRow.appendChild(btnCell);
      qs('.section-info').appendChild(newRow);
    }
  }

  /**
   * Checks the status of the response and throws an error if it's not okay.
   * @param {Response} res - The response object from a fetch request.
   * @throws {Error} - If the response is not okay.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the DOM element with the specified ID.
   * @param {string} name - The ID of the DOM element to retrieve.
   * @returns {Element} The DOM element with the specified ID.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Returns the first element that matches the specified selector.
   * @param {string} selector - The CSS selector to search for.
   * @returns {Element} The first element that matches the selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Creates a new DOM element with the specified tag name.
   * @param {string} tagName - The tag name of the element to create.
   * @returns {Element} The newly created DOM element.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Returns all element that matches the specified selector.
   * @param {string} selector - The CSS selector to search for.
   * @returns {NodeListOf<Element>} An array-like NodeList of DOM elements that match the selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

})();