CREATE TABLE "courses" (
	"code"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT NOT NULL,
	"quarter"	TEXT DEFAULT 'WI',
	"credits"	INTEGER,
	"description"	TEXT,
	"curriculum"	INTEGER DEFAULT 'CSE',
	"prerequisite"	TEXT,
	PRIMARY KEY("code")
);

CREATE TABLE "planned" (
	"user_id"	INTEGER,
	"class_code"	INTEGER,
	"section_sln"	INTEGER UNIQUE,
	"course_section"	TEXT,
	PRIMARY KEY("section_sln")
);

CREATE TABLE "registrations" (
	"user_id"	INTEGER,
	"course_code"	INTEGER,
	"section_sln"	INTEGER UNIQUE,
	PRIMARY KEY("section_sln")
);

CREATE TABLE "sections" (
	"course_code"	INTEGER,
	"section"	TEXT,
	"type"	TEXT,
	"instructor"	TEXT,
	"sln"	INTEGER UNIQUE,
	"curr_enrollment"	INTEGER,
	"availability"	INTEGER,
	PRIMARY KEY("sln")
);

CREATE TABLE "users" (
	"id"	INTEGER,
	"username"	TEXT UNIQUE,
	"password"	TEXT,
	"courses_taken"	TEXT DEFAULT 'None',
	"major"	TEXT DEFAULT 'CSE',
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "sqlite_sequence" (
	"name"	,
	"seq"
);