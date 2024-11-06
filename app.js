/*
 * Name: Sophia Tang, Louisa Chen
 * Date: Nov 1, 2023
 * Section: CSE 154 AF, AD
 * This is the app.js page for index.html. It handles all the backend behavior for the webiste.
 */

'use strict';

const express = require('express');
const app = express();
const multer = require('multer');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

// Retrieves classes' code, title, quarter, and credits based on search criteria.
app.get('/myplan/all/:prereq', async (req, res) => {
  let search = req.query.search;
  let prereq = req.params.prereq;
  if (search) {
    try {
      let db = await getDBConnection();
      let qry;
      if (prereq === 'none') {
        qry = 'SELECT code, title, quarter, credits FROM courses WHERE (code = ?' +
          ` OR title LIKE ? OR credits = ?) AND prerequisite = 'None'`;
      } else {
        qry = 'SELECT code, title, quarter, credits FROM courses WHERE code = ?' +
          ' OR title LIKE ? OR credits = ?';
      }
      let response = await db.all(qry, [search, `%${search}%`, search]);

      await db.close();
      if (response.length === 0) {
        let jsonString = "\"We couldn't find anything matching your search.\"";
        response = JSON.parse(jsonString);
      }
      res.json({courses: response});
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

// Retrieves information about a single class based on the class title.
app.get('/myplan/courses/:course', async (req, res) => {
  try {
    let db = await getDBConnection();
    let courseCode = req.params.course;
    let courseOverviewQry = 'SELECT * FROM courses WHERE code = ?';
    let courseOverview = await db.get(courseOverviewQry, courseCode);
    let courseInfo = await getCourseInfo(db, courseCode);
    let newCourseInfo = editCourseInfo(courseInfo);
    await db.close();
    let response = {
      course: `${courseOverview.code} ${courseOverview.title} (${courseOverview.credits})`,
      courseOverview: {
        description: courseOverview.description,
        prerequisite: courseOverview.prerequisite,
        quarter: courseOverview.quarter,
        curriculum: courseOverview.currculum
      },
      courseInfo: newCourseInfo
    };
    if (courseOverview) {
      res.json(response);
    } else {
      res.type('text');
      res.status(400).send('Sorry. This course does not exist.');
    }
  } catch (err) {
    res.type('text');
    res.status(500).send('An error occurred on the server. Try again later.');
  }
});

// Adds a course to a user's plan.
app.post('/myplan/course/add', async (req, res) => {
  let code = req.body.code;
  let section = req.body.section;
  let userId = req.body.id;
  if (section && code && userId) {
    try {
      let db = await getDBConnection();
      let courseInfo = await getCourseInfoFromDB(db, code, section);
      if (!courseInfo) {
        res.type('text');
        res.status(400).send('Sorry. This course does not exist.');
        await db.close();
      } else {
        let addedCourses = await addCoursesToPlanned(db, userId, courseInfo, code, section);
        await db.close();
        res.json({
          course: code,
          sections: addedCourses
        });
      }
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

// Retrieves registered courses for a specific user.
app.get('/myplan/user/registered', async (req, res) => {
  let user = req.query.user;
  if (user) {
    try {
      let db = await getDBConnection();
      let courseQry = 'SELECT code, title, credits FROM courses JOIN registrations ON' +
        ' courses.code = registrations.course_code WHERE registrations.user_id = ?';
      let courseInfo = await db.all(courseQry, user);
      let sectionQry = 'SELECT sln, section, type, curr_enrollment, availability' +
        ' FROM sections JOIN registrations ON sections.course_code = registrations.course_code' +
        ' AND sections.sln = registrations.section_sln WHERE registrations.user_id = ?';
      let sectionInfo = await db.all(sectionQry, user);
      await db.close();
      let response;
      if (courseInfo && sectionInfo) {
        response = editCourseCards(courseInfo, sectionInfo);
      } else {
        response = {};
      }
      res.json({registered: response});
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

// Retrieves planned courses in the user's cart.
app.get('/myplan/user/cart', async (req, res) => {
  let id = req.query.id;
  if (id) {
    try {
      let db = await getDBConnection();
      let courseQry = 'SELECT code, title, credits FROM courses JOIN planned ON' +
        ' courses.code = planned.class_code WHERE planned.user_id = ?';
      let courseInfo = await db.all(courseQry, id);
      let sectionQry = 'SELECT sln, section, type, curr_enrollment, availability' +
        ' FROM sections JOIN planned ON sections.course_code = planned.class_code' +
        ' AND sections.section = planned.course_section WHERE planned.user_id = ?';
      let sectionInfo = await db.all(sectionQry, id);
      await db.close();
      let response;
      if (courseInfo && sectionInfo) {
        response = editCourseCards(courseInfo, sectionInfo);
      } else {
        response = {};
      }
      res.json({planned: response});
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

// Registers a user for a specific course.
app.post('/myplan/user/registration', async (req, res) => {
  let sln = req.body.sln;
  let code = req.body.code;
  let user = req.body.user;
  if (sln && code && user) {
    try {
      let db = await getDBConnection();
      let prereq = await getPrerequisite(db, code);
      let userCourses = await getUserCourses(db, user);
      let major = await getUserMajor(db, user);
      let avail = await checkAvail(db, sln);
      await db.run('DELETE FROM planned WHERE user_id = ?', user);
      if (shouldRejectRegistration(userCourses, avail, major, code, prereq)) {
        let rejectionMessage = getRejectionMessage(userCourses, avail, major, sln, code, prereq);
        res.type('text');
        res.status(400).send(rejectionMessage);
      } else {
        await registerUserForCourse(db, sln, user, code);
        await db.close();
        res.type('text').send('Registered Successfully!');
      }
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

// Logs in a user with the provided username and password, and retrieves the user's information.
app.post('/myplan/user/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    try {
      let db = await getDBConnection();
      let qry = 'SELECT * FROM users WHERE username = ? AND password = ?';
      let userInfo = await db.get(qry, [username, password]);
      await db.close();
      if (!userInfo) {
        res.type('text');
        res.status(400).send('User does not exist or entered wrong password.');
      } else if (userInfo.courses_taken !== 'None') {
        res.json({
          user: userInfo.id,
          username: userInfo.username,
          coursesTaken: userInfo.courses_taken.split(', ')
        });
      } else {
        res.json(userInfo);
      }
    } catch (err) {
      res.type('text');
      res.status(500).send('An error occurred on the server. Try again later.');
    }
  } else {
    res.type('text');
    res.status(400).send('Missing one or more of the required params.');
  }
});

/**
 * Retrieves detailed information about a course from the database.
 *
 * @param {sqlite.Database} db - The SQLite database connection.
 * @param {string} code - The code of the course.
 * @param {string} section - The section of the course.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing
 *                                 detailed course information or null if not found.
 */
async function getCourseInfoFromDB(db, code, section) {
  let courseQry = 'SELECT code, sln, section, type FROM courses, sections' +
    ' WHERE courses.code = sections.course_code AND courses.code = ?' +
    ' AND sections.section = ?';
  let courseInfo = await db.get(courseQry, [code, section]);
  return courseInfo;
}

/**
 * Adds courses to the planned list for a user in the database.
 *
 * @param {sqlite.Database} db - The SQLite database connection.
 * @param {string} userId - The user ID.
 * @param {Object} courseInfo - The detailed information about the course.
 * @param {string} code - The course code.
 * @param {string} section - The section of the course.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of section numbers
 *                                   that were added.
 */
async function addCoursesToPlanned(db, userId, courseInfo, code, section) {
  let addedCourses = [];

  let addQry = 'INSERT INTO planned (user_id, class_code, section_sln, course_section)' +
    ' VALUES (?, ?, ?, ?)';
  let addedLec = await lecIsAdded(db, userId, code, section.charAt(0));

  if (courseInfo.type === 'Quiz' && !addedLec) {
    let lecInfo = await getLectureInfo(db, code, section.charAt(0));
    await db.run(addQry, [userId, lecInfo.code, lecInfo.sln, lecInfo.section]);
    addedCourses.push(lecInfo.section);
  }

  await db.run(addQry, [userId, courseInfo.code, courseInfo.sln, courseInfo.section]);
  addedCourses.push(courseInfo.section);

  return addedCourses;
}

/**
 * Checks if a lecture is already added to a user's planned courses.
 *
 * @param {Object} db - The database connection object.
 * @param {string} userId - The user ID.
 * @param {string} code - The course code.
 * @param {string} section - The section of the course.
 * @returns {Promise<boolean>} A promise that resolves to true if the lecture is already added.
 */
async function lecIsAdded(db, userId, code, section) {
  let planned = await db.all('SELECT * FROM planned WHERE user_id = ?', userId);
  let registrationMap = planned.reduce((acc, entry) => {
    if (!acc[entry.class_code]) {
      acc[entry.class_code] = [];
    }
    acc[entry.class_code].push(entry.course_section);
    return acc;
  }, {});
  return code in registrationMap &&
    registrationMap[code].includes(section);
}

/**
 * Retrieves information about a lecture associated with a quiz.
 *
 * @param {sqlite.Database} db - The SQLite database connection.
 * @param {string} code - The code of the course.
 * @param {string} section - The section of the quiz.
 * @returns {Promise<Object>} A promise that resolves to an object containing information
 *                            about the associated lecture.
 */
async function getLectureInfo(db, code, section) {
  let lectureQry = 'SELECT code, sln, section, type FROM courses, sections' +
    ' WHERE courses.code = sections.course_code AND courses.code = ?' +
    ' AND sections.section = ?';
  let lectureInfo = await db.get(lectureQry, [code, section]);
  return lectureInfo;
}

/**
 * Determines whether to reject the registration for a course based on certain conditions.
 *
 * @param {string} userCourses - The user's current courses.
 * @param {number} avail - The availability of the course section.
 * @param {string} major - The major of the user.
 * @param {string} code - The code of the course to register.
 * @param {string} prereq - The prerequisite of the course.
 * @returns {boolean} True if the registration should be rejected, otherwise false.
 */
function shouldRejectRegistration(userCourses, avail, major, code, prereq) {
  return userCourses !== 'None' && avail !== 0 && major === 'CSE' &&
    (userCourses.includes(code) || (!userCourses.includes(prereq) && prereq !== 'None'));
}

/**
 * Generates a rejection message based on certain conditions.
 *
 * @param {string} userCourses - The user's current courses.
 * @param {number} avail - The availability of the course section.
 * @param {string} major - The major of the user.
 * @param {string} sln - The section number of the course.
 * @param {string} code - The code of the course.
 * @param {string} prereq - The prerequisite of the course.
 * @returns {string} The rejection message.
 */
function getRejectionMessage(userCourses, avail, major, sln, code, prereq) {
  if (avail <= 0 || major !== 'CSE') {
    return (avail <= 0) ?
      `Section with sln ${sln} is closed.` :
      'The courses you planned to register is CSE major only.';
  } else if (userCourses.includes(code)) {
    return `You have already taken ${code}.`;
  }
  return `You have not met the prerequisite of ${prereq} for ${code}.`;
}

/**
 * Registers a user for a specific course.
 *
 * @param {Object} db - The database connection object.
 * @param {string} sln - The section number of the course.
 * @param {string} user - The user ID.
 * @param {string} code - The code of the course.
 * @returns {Promise<void>} A promise that resolves once the user is registered for the course.
 */
async function registerUserForCourse(db, sln, user, code) {
  await db.run('UPDATE sections SET curr_enrollment = curr_enrollment + 1 WHERE sln = ?', sln);
  let qry = 'INSERT INTO registrations (user_id, course_code, section_sln) VALUES (?, ?, ?)';
  await db.run(qry, [user, code, sln]);
}

/**
 * Retrieves detailed course information from the database.
 * @param {Object} db - The database connection object.
 * @param {string} courseCode - The code of the course for which information is requested.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects
 *                                   representing detailed course information.
 */
async function getCourseInfo(db, courseCode) {
  let courseInfoQry = 'SELECT section, type, instructor, ' +
    ' sln, curr_enrollment, availability FROM courses, sections' +
    ' WHERE courses.code = sections.course_code' +
    ' AND courses.code = ? ORDER BY sections.section ASC';
  let courseInfo = await db.all(courseInfoQry, courseCode);
  return courseInfo;
}

/**
 * Checks the availability of a course section.
 * @param {sqlite.Database} db - SQLite database connection
 * @param {string} sln - Section number
 * @returns {Promise<number>} Returns the available seats in the course section.
 * @throws Will throw an error if an error occurs during the database operation.
 */
async function checkAvail(db, sln) {
  let availQry = 'SELECT curr_enrollment, availability FROM sections WHERE sln = ?';
  let availStatus = await db.get(availQry, sln);
  let curr = availStatus.curr_enrollment;
  let max = availStatus.availability;
  return max - curr;
}

/**
 * Retrieves the prerequisite of a course.
 * @param {sqlite.Database} db - SQLite database connection
 * @param {string} code - Course code
 * @returns {Promise<string>} Returns the prerequisite of the specified course.
 * @throws Will throw an error if an error occurs during the database operation.
 */
async function getPrerequisite(db, code) {
  let prereqQry = 'SELECT prerequisite FROM courses WHERE code = ?';
  let prerequisite = await db.get(prereqQry, code);
  return prerequisite.prerequisite;
}

/**
 * Retrieves the courses taken by a user.
 * @param {sqlite.Database} db - SQLite database connection
 * @param {string} user - User ID
 * @returns {Promise<string[]>} Returns an array of course codes taken by the user.
 * @throws Will throw an error if an error occurs during the database operation.
 */
async function getUserCourses(db, user) {
  let userQry = 'SELECT courses_taken FROM users WHERE id = ?';
  let coursesTaken = await db.get(userQry, user);
  return (coursesTaken.courses_taken).split(', ');
}

/**
 * Retrieves the major of a user.
 * @param {sqlite.Database} db - SQLite database connection
 * @param {string} user - User ID
 * @returns {Promise<string>} Returns the major of the specified user.
 * @throws Will throw an error if an error occurs during the database operation.
 */
async function getUserMajor(db, user) {
  let userQry = 'SELECT major FROM users WHERE id = ?';
  let major = await db.get(userQry, user);
  return major.major;
}

/**
 * Formats course cards for display in the UI.
 * @param {Array} courseInfo - Array of course information objects
 * @param {Array} sectionInfo - Array of section information objects
 * @returns {Array} Returns an array of formatted course cards.
 */
function editCourseCards(courseInfo, sectionInfo) {
  let results = [];
  if (courseInfo.length === sectionInfo.length) {
    for (let i = 0; i < courseInfo.length; i++) {
      let course = courseInfo[i];
      let section = sectionInfo[i];

      let availStatus = `${section.availability - section.curr_enrollment}` +
        ` avail of ${section.availability}`;

      results.push({
        title: `${course.code} - ${course.title}`,
        credits: course.credits,
        availability: availStatus,
        section: section.section,
        type: section.type,
        sln: section.sln
      });
    }
  } else {
    results = [];
  }
  return results;
}

/**
 * Formats course information for display in the UI.
 * @param {Array} courseInfo - Array of course information objects
 * @returns {Array} Returns an array of formatted course information.
 */
function editCourseInfo(courseInfo) {
  let results = [];
  for (let i = 0; i < courseInfo.length; i++) {
    let currSection = courseInfo[i];
    let avail = currSection.availability;
    let currEnroll = currSection.curr_enrollment;
    let newSection = {
      section: currSection.section,
      type: currSection.type,
      instructor: currSection.instructor,
      sln: currSection.sln,
      availability: `${avail - currEnroll} avail of ${avail}`
    };
    results.push(newSection);
  }
  return results;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {sqlite3.Database} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'myplan.db',
    driver: sqlite3.Database
  });

  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);