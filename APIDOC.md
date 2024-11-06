MyPlan API Documentation
This API stores all winter quarter cse courses, user planned courses, and user registered courses.
It enables the user to access or change different table databases while necessary.

## Get all courses
**Request Format:** /myplan/all/:prereq with query parameters of search keywords in format of `search`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint retrieves classes' code, title, quarter, and credits based on search criteria.

**Example Request:** myplan/all/123?search=programming

**Example Response:**

```JSON
{
  "courses": [
    {
      "code": 121,
      "title": "Introduction to Computer Programming I",
      "quarter": "WI",
      "credits": 4
    },
    {
      "code": 122,
      "title": "Introduction to Computer Programming II",
      "quarter": "WI",
      "credits": 4
    },
    ...
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `An error occurred on the server. Try again later.`
Possible 400 errors (all plain text):
  - If a request is missing one (or more) of the required parameters, returns error with `Missing one or more of the required params.`

## Get a course's information
**Request Format:** /myplan/courses/:course

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint retrieves information about a single class based on the class title.

**Example Request:** /myplan/courses/123

**Example Response:**

```JSON
{
  "course": "123 Introduction to Computer Programming III (4)",
  "courseOverview": {
    "description": "Computer programming for students with significant previous programming experience. Emphasizes implementation and run-time analysis of data structures and algorithms using techniques including linked references, recursion, and object-oriented inheritance to solve computational problems motivated by modern societal and scientific needs.",
    "prerequisite": "None",
    "quarter": "WI"
  },
  "courseInfo": [
    {
      "section": "A",
      "type": "Lecture",
      "instructor": "Brett Wortzman, James Rasmussen Wilcox",
      "sln": 12794,
      "availability": "40 avail of 40"
    },
    {
      "section": "AA",
      "type": "Quiz",
      "instructor": null,
      "sln": 12795,
      "availability": "10 avail of 10"
    },
    ...
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `An error occurred on the server. Try again later.`
Possible 400 errors (all plain text):
  - If a request is missing one (or more) of the required parameters, returns error with `Missing one or more of the required params.`
  - If cannot find any information that matches with the given course code, returns error with `Sorry. This course does not exist.`

## Add a course
**Request Format:** /myplan/course/add with POST parameters of course code and lecture/quiz section and user id in the format `code`, `section`, `id`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** This endpoint adds a course to a user's plan. If a section is added, the lecture will be added as well.


**Example Request:** POST parameters of `code=123`, `section=A`, `id=4`

**Example Response:**

```JSON
{
  "course": "123",
  "sections": [
    "A"
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `An error occurred on the server. Try again later.`
Possible 400 errors (all plain text):
  - If a request is missing one (or more) of the required parameters, returns error with `Missing one or more of the required params.`
  - If cannot find any information that matches with the given course code, returns error with `Sorry. This course does not exist.`

## Retrieve user's registered courses
**Request Format:** /myplan/user/registered with query parameter in format of `user`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint retrieves registered courses for a specific user.


**Example Request:** /myplan/user/registered?user=1

**Example Response:**

```JSON
{
  "registered": [
    {
      "title": "163 - Intermediate Data Programming",
      "credits": 4,
      "availability": "56 avail of 60",
      "section": "A",
      "type": "Lecture",
      "sln": 12850
    },
    {
      "title": "163 - Intermediate Data Programming",
      "credits": 4,
      "availability": "12 avail of 15",
      "section": "AA",
      "type": "Quiz",
      "sln": 12851
    }
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `An error occurred on the server. Try again later.`
Possible 400 errors (all plain text):
  - If a request is missing one (or more) of the required parameters, returns error with `Missing one or more of the required params.`

## Retrieve user's planned courses
**Request Format:** /myplan/user/cart with query parameter of `id`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint retrieves planned courses in the user's cart.


**Example Request:** /myplan/user/cart?id=4

**Example Response:**

```JSON
{
  "planned": [
    {
      "title": "123 - Introduction to Computer Programming III",
      "credits": 4,
      "availability": "40 avail of 40",
      "section": "A",
      "type": "Lecture",
      "sln": 12794
    },
    {
      "title": "123 - Introduction to Computer Programming III",
      "credits": 4,
      "availability": "10 avail of 10",
      "section": "AA",
      "type": "Quiz",
      "sln": 12795
    }
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `An error occurred on the server. Try again later.`
Possible 400 errors (all plain text):
  - If a request is missing one (or more) of the required parameters, returns error with `Missing one or more of the required params.`

## Register a course
**Request Format:** /myplan/user/registration with POST parameters of course code, section sln number, and user id in the format `code`, `user`, `sln`

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** This endpoint registers a user for a specific course

**Example Request:** POST parameters of `sln=123`, `section=aa`

**Example Response:**

```
Registered Successfully!
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `something went wrong on the server`
  - If the error code is 'ENOENT', returns error with `file does not exist`

Possible 400 error (plain text):
  - If not all parameters are passed in, returns error with `Missing required parameters`
  - If the section is already closed, returns error with `Section with sln ${sln} is closed.`
  - If the user is not a CSE major, returns error with `The courses you planned to register is CSE major only.`
  - If the user already taken the course, returns error with `You have already taken ${code}.`
  - If the user does not meet the prerequisite for the course, returns error with `You have not met the prerequisite of ${prereq} for ${code}.`

## User login
**Request Format:** /myplan/user/login with POST parameter of username and password in format of `username`, `password`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** This endpoint logs in a user with the provided username and password and retrieves the user's information.


**Example Request:** /myplan/user/login with POST parameter of `username=Sophia`, `password=123`

**Example Response:**

```json
{
  "user": 1,
  "username": "Sophia",
  "coursesTaken": [
    "121",
    "122",
    "123",
    "311",
    "312"
  ]
}
```

**Error Handling:**
Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `something went wrong on the server`

Possible 400 error (plain text):
  - If not all parameters are passed in, returns error with `Missing required parameters`
  - If cannot find the user in database with given username and password, returns error with `User does not exist or entered wrong password.`