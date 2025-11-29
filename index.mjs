/*    
  Author: Sydney Stalker
  Class: CST 336 - Internet Programming
  Date: 11/29/2025
  Assignment: Lab 6 - Famous Quotes (Admin)
  File: index.mjs
  Abstract: Implements the admin functionality for the Famous Quotes application. 
  Administrators can add, edit, and delete both authors and quotes using 
  pre-filled forms for updates and database-driven validation. The app 
  provides full CRUD support with a clean UI using custom CSS.

  RUBRIC:
    • Administrators can add new authors (all fields except author id) – 15 pts
    • Administrators can add new quotes (all fields except quote id) – 15 pts
    • Administrators can edit existing authors with pre-filled values – 20 pts
    • Administrators can edit existing quotes with pre-filled values – 20 pts
    • Administrators can delete authors – 10 pts
    • Administrators can delete quotes – 10 pts
    • App has a nice design using Bootstrap or custom CSS – 10 pts
*/

import express from "express";
import mysql from "mysql2/promise";

const app = express();

// View engine and static files
app.set("view engine", "ejs");
app.use(express.static("public"));

// For Express to get values using POST method
app.use(express.urlencoded({ extended: true }));

// Setting up database connection pool
const pool = mysql.createPool({
  host: "w1h4cr5sb73o944p.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "f22soef3w721uqas",
  password: "w2rrbwa0a7q112xi",
  database: "qwfpbrplqjdhpu25",
  connectionLimit: 10,
  waitForConnections: true,
});

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

// Home (admin dashboard)
app.get("/", (req, res) => {
  res.render("index");
});

// ------------------------- AUTHORS ----------------------------------

// Display form for input Author information
app.get("/author/new", (req, res) => {
  res.render("newAuthor");
});

// Add new Author (all fields except authorId)
app.post("/author/new", async function (req, res) {
  const fName = req.body.fName;
  const lName = req.body.lName;
  const birthDate = req.body.birthDate;
  const deathDate = req.body.deathDate || null; // dod can be NULL
  const sex = req.body.sex;
  const profession = req.body.profession;
  const country = req.body.country;
  const portrait = req.body.portrait;
  const biography = req.body.biography;

  const sql = `
    INSERT INTO q_authors
      (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    fName,
    lName,
    birthDate,
    deathDate,
    sex,
    profession,
    country,
    portrait,
    biography,
  ];

  try {
    await pool.query(sql, params);
    res.render("newAuthor", { message: "Author added!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error inserting author");
  }
});

// List all authors
app.get("/authors", async function (req, res) {
  const sql = `
    SELECT *
    FROM q_authors
    ORDER BY lastName
  `;
  const [rows] = await pool.query(sql);
  res.render("authorList", { authors: rows });
});

// Show pre-populated form to edit an author (all fields)
app.get("/author/edit", async function (req, res) {
  const authorId = req.query.authorId;

  const sql = `
    SELECT *,
           DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
           DATE_FORMAT(dod, '%Y-%m-%d') dodISO
    FROM q_authors
    WHERE authorId = ?
  `;
  const [rows] = await pool.query(sql, [authorId]);
  res.render("editAuthor", { authorInfo: rows });
});

// Handle author update (all fields except authorId)
app.post("/author/edit", async function (req, res) {
  const sql = `
    UPDATE q_authors
    SET firstName  = ?,
        lastName   = ?,
        dob        = ?,
        dod        = ?,
        sex        = ?,
        profession = ?,
        country    = ?,
        portrait   = ?,
        biography  = ?
    WHERE authorId = ?
  `;

  const params = [
    req.body.fName,
    req.body.lName,
    req.body.dob,
    req.body.dod || null,
    req.body.sex,
    req.body.profession,
    req.body.country,
    req.body.portrait,
    req.body.biography,
    req.body.authorId,
  ];

  try {
    await pool.query(sql, params);
    res.redirect("/authors");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error updating author");
  }
});

// Delete Author
app.get("/author/delete", async function (req, res) {
  const authorId = req.query.authorId;

  const sql = `
    DELETE
    FROM q_authors
    WHERE authorId = ?
  `;

  try {
    await pool.query(sql, [authorId]);
    res.redirect("/authors");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error deleting author");
  }
});

// ------------------------- QUOTES -----------------------------------

// List all quotes
app.get("/quotes", async function (req, res) {
  const sql = `
    SELECT q.*,
           CONCAT(a.firstName, ' ', a.lastName) AS authorName
    FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
    ORDER BY q.quoteId
  `;
  const [rows] = await pool.query(sql);
  res.render("quoteList", { quotes: rows });
});

// Show pre-populated form to edit a quote
app.get("/quote/edit", async function (req, res) {
  const quoteId = req.query.quoteId;

  const sql = `
    SELECT *
    FROM q_quotes
    WHERE quoteId = ?
  `;
  const [rows] = await pool.query(sql, [quoteId]);
  res.render("editQuote", { quoteInfo: rows });
});

// Handle quote update
app.post("/quote/edit", async function (req, res) {
  const sql = `
    UPDATE q_quotes
    SET quote    = ?,
        authorId = ?,
        category = ?,
        likes    = ?
    WHERE quoteId = ?
  `;

  const params = [
    req.body.quote,
    req.body.authorId,
    req.body.category,
    req.body.likes,
    req.body.quoteId,
  ];

  try {
    await pool.query(sql, params);
    res.redirect("/quotes");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error updating quote");
  }
});

// Delete quote
app.get("/quote/delete", async function (req, res) {
  const quoteId = req.query.quoteId;

  const sql = `
    DELETE FROM q_quotes
    WHERE quoteId = ?
  `;

  try {
    await pool.query(sql, [quoteId]);
    res.redirect("/quotes");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error deleting quote");
  }
});

// Display form to add a new quote (with category dropdown)
app.get("/quote/new", async (req, res) => {
  const sql = `
    SELECT DISTINCT category
    FROM q_quotes
    ORDER BY category
  `;
  const [categories] = await pool.query(sql);

  res.render("newQuote", { categories });
});

// Add new Quote
app.post("/quote/new", async function (req, res) {
  const quote = req.body.quote;
  const authorId = req.body.authorId;
  const category = req.body.category;
  const likes = req.body.likes;

  const sql = `
    INSERT INTO q_quotes
      (quote, authorId, category, likes)
    VALUES (?, ?, ?, ?)
  `;

  const params = [quote, authorId, category, likes];

  try {
    await pool.query(sql, params);

    // Reload categories for the form after successful insert
    const [categories] = await pool.query(
      "SELECT DISTINCT category FROM q_quotes ORDER BY category"
    );

    res.render("newQuote", { categories, message: "Quote added!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error inserting quote");
  }
});

// ------------------------- DB TEST ----------------------------------

// dbTest
app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT CURDATE() AS today");
    res.send(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Database error");
  }
});

// ---------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------

app.listen(3000, () => {
  console.log("Express server running on http://localhost:3000");
});
