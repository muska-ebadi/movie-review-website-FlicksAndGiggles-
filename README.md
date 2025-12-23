# Flicks & Giggles 🎬

Flicks & Giggles is a team-based movie review website built as part of a university Web Programming course.  
The project allows users to browse movies and submit reviews through a simple web interface.

This was a **group project**, and all stages were completed collaboratively — including planning, design, front-end development, back-end logic, database setup, and testing.

---

## What the website does

- Displays a list of movies
- Allows users to submit movie reviews
- Stores reviews in a MySQL database
- Lets users browse previously submitted reviews
- Uses a clean and simple UI for easy navigation

---

## Technologies used

- **HTML & CSS** – layout and styling  
- **JavaScript** – client-side interactivity  
- **PHP** – server-side logic  
- **MySQL** – database for storing reviews  
- **Apache / WAMP** – local development environment  

---

## Movie data (OMDb API)

We use the **OMDb API** to fetch live movie data.

- JavaScript sends search requests using `fetch()`
- OMDb returns movie data in JSON format
- Movie cards are generated dynamically using the response
- Each card displays the movie title, release year, poster, and related actions

OMDb handles movie information, while our website handles user reviews and storage.

---

## Project structure

- `main.html` – Homepage  
- `Movies.html` – Movie browsing page  
- `BrowseReviews.php` – Displays stored reviews  
- `SubmitReview.html` – Review submission form  
- `submit_review.php` – Handles form submission and database insertion  
- `style.css` – Website styling  
- `script.js` – Client-side scripting  
- `reviews.sql` – Database schema  
- `config.inc.example.php` – Example database configuration  

> **Note:** `config.inc.php` is intentionally ignored for security reasons.

---

## Database setup (local)

1. Import `reviews.sql` into MySQL  
2. Copy `config.inc.example.php`  
3. Rename it to `config.inc.php`  
4. Add your local database credentials  

---

## Team project note

This was a team-based academic project.  
All members contributed to the design, development, debugging, and documentation of the system.

---

## Why this project matters

This project demonstrates:

- Full-stack web development fundamentals  
- Database design and integration  
- Working with APIs and JSON data  
- PHP form handling  
- Team collaboration  
- Clean project structure and version control  

