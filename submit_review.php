<?php
require_once("config.inc.php");

try {
	$pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
	$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

	if (
	    !isset($_POST['username'], $_POST['movie_title'], $_POST['review_text'], $_POST['rating']) ||
	    $_POST['username'] === '' ||
	    $_POST['movie_title'] === '' ||
	    $_POST['review_text'] === ''
	) {
	    die("Missing form fields.");
	}


$rating = filter_input(
    INPUT_POST,
    'rating',
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1, 'max_range' => 5]]
);

if ($rating === false) {
    die('Invalid rating value. Must be 1–5.');
}


$sql = "INSERT INTO reviews (username, movie_title, review_text, rating) VALUES (:username, :movie_title, :review_text, :rating)";

$stmt = $pdo->prepare($sql);

$stmt ->execute ([
	":username" => $_POST["username"],
	":movie_title" => $_POST["movie_title"],
	":review_text" => $_POST["review_text"],
	":rating" => $rating,
]);

echo "Your review has been submitted successfully!";
}

catch (PDOException $e) {
	die("Database Error: " . $e -> getMessage());
}

?>