<?php
require_once("config.inc.php");

try {
    $pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "SELECT username, movie_title, review_text, rating, created_at
            FROM reviews
            ORDER BY created_at DESC";

    $stmt = $pdo->query($sql);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}
?>

<!--page for browsing user-submitted reviews-->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browse Reviews</title>

    <!--stylesheet for layout and design-->
    <link rel="stylesheet" type="text/css" href="style.css">

    <!--script for dynamic loading of reviews-->
    <script src="script.js" defer></script>
</head>
<body>
    <!--main site navigation bar-->
    <nav class="navigation">
        <ul class="navigation-links">
            <li><a href="main.html">Home</a></li>
            <li><a href="BrowseReviews.php" class="active">Browse Reviews</a></li>
            <li><a href="Movies.html">Movies</a></li>
            <li><a href="SubmitReview.html">Submit Review</a></li>
            <li><a href="About.html">About &amp; Contact</a></li>
            <li>
                <!--search form in navigation-->
                <form class="search-box" action="Movies.html" method="get" role="search" aria-label="Site Search">
                    <input type="text" name="query" placeholder="Search" aria-label="Search query" />
                </form>
            </li>
        </ul>
    </nav>

    <!--main content section for reviews-->
    <main class="browse-reviews">
        <h1>Browse Reviews</h1>
        <p>See what other users have said about different movies.</p>

        <!--container for loaded reviews-->
        <div id="reviews-list"></div>
    </main>
</body>
</html>