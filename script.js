console.log("script.js is connected and running!");

// ===============================
// GLOBAL CONSTANTS + HELPERS
// ===============================

var API_KEY = "40915b21";        // OMDb API key
var ADMIN_CODE = "iamadmin";     // turn admin ON
var ADMIN_EXIT_CODE = "exitadmin"; // turn admin OFF

// --- localStorage helpers ---

/**
 * Retrieve the array of stored reviews from localStorage.
 * @return {Array<Object>} An array of review objects, or an empty array if none are stored.
 */
function getStoredReviews() {
    var text = localStorage.getItem("reviews");
    if (!text) {
        return [];
    }
    return JSON.parse(text);
}

/**
 * Save the given list of reviews to localStorage.
 * @param {Array<Object>} list - Array of review objects to store.
 * @return {void}
 */
function saveStoredReviews(list) {
    localStorage.setItem("reviews", JSON.stringify(list));
}

/**
 * Build a lookup map of average ratings keyed by movie title (lowercase).
 * Each entry has sum, count, and avg properties.
 * @return {Object.<string, {sum: number, count: number, avg: number}>} Map of title to rating stats.
 */
function buildAverageRatingsMap() {
    var stored = getStoredReviews();
    var map = {};
    var i;
    for (i = 0; i < stored.length; i++) {
        var r = stored[i];
        if (!r.title || !r.rating) {
            continue;
        }
        var key = r.title.toLowerCase();
        if (!map[key]) {
            map[key] = { sum: 0, count: 0, avg: 0 };
        }
        map[key].sum += Number(r.rating);
        map[key].count += 1;
    }
    for (var k in map) {
        if (map[k].count > 0) {
            map[k].avg = map[k].sum / map[k].count;
        }
    }
    return map;
}

/**
 * Parse a full movie title string in the form "Title (YYYY)" into title and year.
 * @param {string} fullTitle - The combined title/year string.
 * @return {{title: string, year: string}} Parsed title and year (year is empty string if not found).
 */
function splitTitleAndYear(fullTitle) {
    var match = fullTitle.match(/^(.*)\((\d{4})\)\s*$/);
    if (match) {
        return { title: match[1].trim(), year: match[2] };
    }
    return { title: fullTitle, year: "" };
}

// ===============================
// ADMIN MODE (SECRET CODE)
// ===============================

/**
 * Initialize handling of the hidden admin ON/OFF codes in search forms.
 * Adds event listeners to forms with class 'search-box'.
 * @return {void}
 */
function setupAdminCode() {
    var forms = document.querySelectorAll("form.search-box");
    var i;

    /**
     * Handle the search form submit to check for admin codes.
     * @param {SubmitEvent} event - The form submit event.
     */
    function handleAdminSubmit(event) {
        var form = event.currentTarget;
        var input = form.querySelector('input[name="query"]');
        if (!input) {
            return;
        }
        var value = input.value.trim().toLowerCase();

        // Turn ADMIN ON
        if (value === ADMIN_CODE.toLowerCase()) {
            event.preventDefault();
            input.value = "";
            localStorage.setItem("isAdmin", "true");
            alert("Admin mode enabled. You can now edit/delete reviews on Browse Reviews.");
            window.location.href = "BrowseReviews.php";
            return;
        }

        // Turn ADMIN OFF
        if (value === ADMIN_EXIT_CODE.toLowerCase()) {
            event.preventDefault();
            input.value = "";
            localStorage.removeItem("isAdmin");
            alert("Admin mode disabled.");
            window.location.reload();
            return;
        }
        // Otherwise normal search goes to Movies.html
    }

    for (i = 0; i < forms.length; i++) {
        forms[i].addEventListener("submit", handleAdminSubmit);
    }
}

// ===============================
// MOVIES PAGE
// ===============================

/**
 * Initialize the Movies.html page: fetch and render movies, set up search.
 * @return {void}
 */
function setupMoviesPage() {
    var movieGrid = document.getElementById("movieGrid");
    var searchInput = document.getElementById("movieSearch");

    // If we are not on Movies.html, do nothing
    if (!movieGrid) {
        return;
    }

    /**
     * Render a list of movie objects into the movieGrid element.
     * @param {Array<Object>} list - Array of movie data from OMDb API.
     * @return {void}
     */
    function renderMovies(list) {
        movieGrid.innerHTML = "";
        if (!list || list.length === 0) {
            movieGrid.innerHTML = "<p>No movies found.</p>";
            return;
        }
        var averages = buildAverageRatingsMap();
        var i;
        for (i = 0; i < list.length; i++) {
            var m = list[i];
            var poster = (m.Poster && m.Poster !== "N/A")
                ? m.Poster
                : "https://via.placeholder.com/300x450?text=No+Image";
            var trailerUrl = "https://www.youtube.com/results?search_query="
                + encodeURIComponent(m.Title + " trailer");
            var fullTitle = m.Title + " (" + m.Year + ")";
            var stats = averages[fullTitle.toLowerCase()];
            var ratingHtml;
            if (stats) {
                var avgText = stats.avg.toFixed(1);
                var countText = stats.count + " review" + (stats.count > 1 ? "s" : "");
                ratingHtml = '<div class="movie-rating">Average rating: <strong>'
                    + avgText + " / 5</strong> (" + countText + ")</div>";
            } else {
                ratingHtml = '<div class="movie-rating no-reviews">No reviews yet</div>';
            }
            var card = document.createElement("div");
            card.className = "movie-card";
            card.innerHTML = '<img src="' + poster + '" alt="' + m.Title +
                '" class="movie-poster">' +
                '<h3 class="movie-title">' + m.Title + "</h3>" +
                '<p class="movie-year">' + m.Year + "</p>" +
                '<a href="' + trailerUrl +
                '" target="_blank" class="watch-btn">Watch Trailer</a>' +
                ratingHtml +
                '<button type="button" class="review-link">Review this Movie</button>';

            (function (fullTitleCopy, cardCopy) {
                var btn = cardCopy.querySelector(".review-link");
                btn.addEventListener("click", function () {
                    var titleParam = encodeURIComponent(fullTitleCopy);
                    window.location.href = "SubmitReview.html?title=" + titleParam;
                });
            })(fullTitle, card);

            movieGrid.appendChild(card);
        }
    }

    /**
     * Fetch movies from OMDb API by search query and render them.
     * @async
     * @param {string} [query] - Search query string; defaults to "batman" if empty.
     * @return {Promise<void>}
     */
    async function fetchMovies(query) {
        var q = query || "batman";
        try {
            var res = await fetch(
                "https://www.omdbapi.com/?s=" + encodeURIComponent(q) + "&apikey=" + API_KEY
            );
            var data = await res.json();
            if (data.Response === "True") {
                renderMovies(data.Search);
            } else {
                renderMovies([]);
            }
        } catch (e) {
            console.error(e);
            movieGrid.innerHTML = "<p>Error loading movies.</p>";
        }
    }

    // Use ?query= from URL if present
    var urlParams = new URLSearchParams(window.location.search);
    var initialQuery = urlParams.get("query");
    if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
        fetchMovies(initialQuery);
    } else {
        fetchMovies();
    }

    // Simple "type and search" behaviour
    if (searchInput) {
        var typingTimer = null;
        searchInput.addEventListener("input", function () {
            var q = searchInput.value.trim();
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
            typingTimer = setTimeout(function () {
                if (q === "") {
                    fetchMovies("batman");
                } else {
                    fetchMovies(q);
                }
            }, 400);
        });
    }
}

// ===============================
// SUBMIT REVIEW PAGE
// ===============================

/**
 * Initialize the SubmitReview.html page: autocomplete, form submission, localStorage.
 * @return {void}
 */
function setupSubmitReviewPage() {
    var titleInput = document.getElementById("title");
    var datalist = document.getElementById("movie-list");
    var form = document.getElementById("review-form");
    var message = document.getElementById("submit-message");
    var nameInput = document.getElementById("name");
    var ratingSelect = document.getElementById("rating");
    var commentsInput = document.getElementById("comments");

    if (!titleInput || !form) {
        return; // not on SubmitReview.html
    }

    // Prefill title from ?title=
    var params = new URLSearchParams(window.location.search);
    var presetTitle = params.get("title");
    if (presetTitle) {
        titleInput.value = presetTitle;
    }

    // Autocomplete using OMDb
    if (datalist) {
        var timeoutId = null;
        titleInput.addEventListener("input", function () {
            var query = titleInput.value.trim();
            if (query.length < 2) {
                datalist.innerHTML = "";
                return;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(function () {
                fetch(
                    "https://www.omdbapi.com/?apikey=" + API_KEY +
                    "&s=" + encodeURIComponent(query)
                )
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    datalist.innerHTML = "";
                    if (data.Response === "True" && data.Search) {
                        var i;
                        for (i = 0; i < data.Search.length; i++) {
                            var movie = data.Search[i];
                            var opt = document.createElement("option");
                            opt.value = movie.Title + " (" + movie.Year + ")";
                            datalist.appendChild(opt);
                        }
                    }
                })
                .catch(function (err) {
                    console.error("Error fetching autocomplete movies:", err);
                });
            }, 300);
        });
    }

    // Save review to localStorage
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var titleValue = titleInput.value.trim();
        var nameValue = nameInput ? nameInput.value.trim() : "";
        var ratingValue = Number(ratingSelect.value);
        var commentsValue = commentsInput ? commentsInput.value.trim() : "";

        if (!titleValue || !ratingValue) {
            message.textContent = "Please enter a movie title and a rating.";
            message.style.color = "red";
            return;
        }

        var newReview = {
            title: titleValue,
            name: nameValue,
            rating: ratingValue,
            comments: commentsValue,
            date: new Date().toISOString()
        };

        var existing = getStoredReviews();
        existing.push(newReview);
        saveStoredReviews(existing);

        message.textContent = "Your review has been submitted!";
        message.style.color = "green";
        message.style.fontWeight = "bold";
        form.reset();
    });
}

// ===============================
// BROWSE REVIEWS PAGE
// ===============================

/**
 * Initialize the BrowseReviews.php page: list reviews, allow admin edits/deletions.
 * @return {void}
 */
function setupBrowseReviewsPage() {
    var container = document.getElementById("reviews-list");
    if (!container) {
        return;
    }
    var storedReviews = getStoredReviews();
    var isAdmin = localStorage.getItem("isAdmin") === "true";

    if (!storedReviews.length) {
        container.innerHTML = "<p>No reviews have been submitted yet.</p>";
        return;
    }

    storedReviews.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    for (var i = 0; i < storedReviews.length; i++) {
        (function (rev, index) {
            var card = document.createElement("div");
            card.className = "review-card";
            var title = rev.title || "Unknown title";
            var name = rev.name || "Anonymous";
            var rating = rev.rating || "?";
            var comments = rev.comments || "";
            var dateText = rev.date ? new Date(rev.date).toLocaleDateString() : "";

            card.innerHTML =
                '<h3 class="review-movie-title">' + title + "</h3>" +
                '<p class="review-meta">' +
                    '<span class="review-rating">Rating: <strong>' + rating + " / 5</strong></span>" +
                    '<span class="review-author">by ' + name + "</span>" +
                    (dateText ? '<span class="review-date">on ' + dateText + "</span>" : "") +
                "</p>" +
                (comments
                    ? '<p class="review-comments">' + comments + "</p>"
                    : '<p class="review-comments empty">No comments provided.</p>');

            if (isAdmin) {
                var actions = document.createElement("div");
                actions.className = "review-admin-actions";
                actions.innerHTML =
                    '<button type="button" class="edit-review-btn">Edit</button>' +
                    '<button type="button" class="delete-review-btn">Delete</button>';
                card.appendChild(actions);

                var editBtn = actions.querySelector(".edit-review-btn");
                var deleteBtn = actions.querySelector(".delete-review-btn");

                // DELETE
                deleteBtn.addEventListener("click", function () {
                    if (!confirm("Delete this review?")) {
                        return;
                    }
                    storedReviews.splice(index, 1);
                    saveStoredReviews(storedReviews);
                    location.reload();
                });

                // EDIT (rating + comments together)
                editBtn.addEventListener("click", function () {
                    var metaEl = card.querySelector(".review-meta");
                    var commentsEl = card.querySelector(".review-comments");
                    if (metaEl) metaEl.style.display = "none";
                    if (commentsEl) commentsEl.style.display = "none";
                    actions.style.display = "none";

                    var formDiv = document.createElement("div");
                    formDiv.className = "admin-edit-form";
                    formDiv.innerHTML =
                        '<label class="admin-edit-label">' +
                            'Rating (1–5): ' +
                            '<input type="number" min="1" max="5" step="1" value="' +
                            (rev.rating || "") + '" class="admin-edit-rating">' +
                        "</label>" +
                        '<label class="admin-edit-label">' +
                            "Comments:" +
                            '<textarea class="admin-edit-comments">' +
                            (rev.comments || "") + "</textarea>" +
                        "</label>" +
                        '<div class="admin-edit-buttons">' +
                            '<button type="button" class="admin-save-btn">Save</button>' +
                            '<button type="button" class="admin-cancel-btn">Cancel</button>' +
                        "</div>";
                    card.appendChild(formDiv);

                    var ratingInput = formDiv.querySelector(".admin-edit-rating");
                    var commentsInput = formDiv.querySelector(".admin-edit-comments");
                    var saveBtn = formDiv.querySelector(".admin-save-btn");
                    var cancelBtn = formDiv.querySelector(".admin-cancel-btn");

                    cancelBtn.addEventListener("click", function () {
                        card.removeChild(formDiv);
                        if (metaEl) metaEl.style.display = "";
                        if (commentsEl) commentsEl.style.display = "";
                        actions.style.display = "";
                    });

                    saveBtn.addEventListener("click", function () {
                        var newRating = Number(ratingInput.value);
                        var newComments = commentsInput.value.trim();
                        if (!newRating || newRating < 1 || newRating > 5) {
                            alert("Rating must be a number from 1 to 5.");
                            return;
                        }
                        rev.rating = newRating;
                        rev.comments = newComments;
                        storedReviews[index] = rev;
                        saveStoredReviews(storedReviews);

                        var ratingSpan = card.querySelector(".review-rating strong");
                        if (ratingSpan) {
                            ratingSpan.textContent = newRating + " / 5";
                        }
                        if (commentsEl) {
                            if (newComments) {
                                commentsEl.textContent = newComments;
                                commentsEl.classList.remove("empty");
                            } else {
                                commentsEl.textContent = "No comments provided.";
                                commentsEl.classList.add("empty");
                            }
                        }

                        card.removeChild(formDiv);
                        if (metaEl) metaEl.style.display = "";
                        if (commentsEl) commentsEl.style.display = "";
                        actions.style.display = "";
                    });
                });
            }

            container.appendChild(card);
        })(storedReviews[i], i);
    }
}

// ===============================
// HOME PAGE (main.html)
// ===============================

/**
 * Initialize the main.html home page: show trending movies and latest reviews.
 * @return {void}
 */
function setupHomePage() {
    var trendingGrid = document.getElementById("trending-grid");
    var latestList = document.getElementById("latest-reviews-list");

    // if not on home page, nothing to do
    if (!trendingGrid && !latestList) {
        return;
    }

    var allReviews = getStoredReviews();
    if (!allReviews.length) {
        if (trendingGrid) {
            trendingGrid.innerHTML = "<p>No reviews yet. Be the first to add one!</p>";
        }
        if (latestList) {
            latestList.innerHTML = "<li>No reviews yet.</li>";
        }
        return;
    }

    // Build movie stats
    var movieStats = {};
    var i;
    for (i = 0; i < allReviews.length; i++) {
        var r = allReviews[i];
        var title = r.title || "Unknown movie";
        var key = title.toLowerCase();
        var rating = Number(r.rating) || 0;
        var dateObj = r.date ? new Date(r.date) : new Date(0);

        if (!movieStats[key]) {
            movieStats[key] = {
                title: title,
                sum: 0,
                count: 0,
                latestDate: dateObj,
                avg: 0
            };
        }
        movieStats[key].sum += rating;
        movieStats[key].count += 1;
        if (dateObj > movieStats[key].latestDate) {
            movieStats[key].latestDate = dateObj;
        }
    }

    var statsArray = [];
    for (var k in movieStats) {
        var m = movieStats[k];
        if (m.count > 0) {
            m.avg = m.sum / m.count;
        }
        statsArray.push(m);
    }

    // Sort: more reviews first, then newest latest review
    statsArray.sort(function (a, b) {
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        return b.latestDate - a.latestDate;
    });

    var topTrending = statsArray.slice(0, 5);

    // ---- Trending cards with posters ----
    if (trendingGrid) {
        trendingGrid.innerHTML = "";
        (function buildTrendingCards(index) {
            if (index >= topTrending.length) {
                return;
            }
            var info = topTrending[index];
            var card = document.createElement("div");
            card.className = "movie-card";
            card.innerHTML = "<p>Loading " + info.title + "...</p>";
            trendingGrid.appendChild(card);

            var parsed = splitTitleAndYear(info.title);
            var titleOnly = parsed.title;
            var yearOnly = parsed.year;
            var url = "https://www.omdbapi.com/?apikey=" + API_KEY +
                "&t=" + encodeURIComponent(titleOnly);
            if (yearOnly) {
                url += "&y=" + yearOnly;
            }

            fetch(url)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.Response === "True") {
                        var poster = data.Poster && data.Poster !== "N/A"
                            ? data.Poster
                            : "https://via.placeholder.com/300x450?text=No+Image";
                        var trailerUrl = "https://www.youtube.com/results?search_query="
                            + encodeURIComponent(data.Title + " trailer");
                        var fullTitle = data.Title + " (" + data.Year + ")";
                        card.innerHTML =
                            '<img src="' + poster + '" alt="' + data.Title +
                            '" class="movie-poster">' +
                            '<h3 class="movie-title">' + data.Title + "</h3>" +
                            '<p class="movie-year">' + data.Year + "</p>" +
                            '<a href="' + trailerUrl +
                            '" target="_blank" class="watch-btn">Watch Trailer</a>' +
                            '<div class="movie-rating">Average rating: <strong>' +
                            info.avg.toFixed(1) + " / 5</strong> (" +
                            info.count + ' review' + (info.count > 1 ? "s" : "") +
                            ")</div>" +
                            '<button type="button" class="review-link">Review this Movie</button>';
                        var btn = card.querySelector(".review-link");
                        btn.addEventListener("click", function () {
                            var titleParam = encodeURIComponent(fullTitle);
                            window.location.href = "SubmitReview.html?title=" + titleParam;
                        });
                    } else {
                        card.innerHTML =
                            '<h3 class="movie-title">' + info.title + "</h3>" +
                            '<div class="movie-rating">Average rating: <strong>' +
                            info.avg.toFixed(1) + " / 5</strong> (" +
                            info.count + ' review' + (info.count > 1 ? "s" : "") +
                            ")</div>";
                    }
                })
                .catch(function () {
                    card.innerHTML =
                        '<h3 class="movie-title">' + info.title + "</h3>" +
                        "<p>Could not load movie details.</p>" +
                        '<div class="movie-rating">Average rating: <strong>' +
                        info.avg.toFixed(1) + " / 5</strong> (" +
                        info.count + ' review' + (info.count > 1 ? "s" : "") +
                        ")</div>";
                })
                .finally(function () {
                    buildTrendingCards(index + 1);
                });
        })(0);
    }

    // ---- Latest reviews list ----
    if (latestList) {
        var sorted = allReviews.slice();
        sorted.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        var latestFive = sorted.slice(0, 5);
        latestList.innerHTML = "";

        for (i = 0; i < latestFive.length; i++) {
            var rev = latestFive[i];
            var title2 = rev.title || "Unknown title";
            var name2 = rev.name || "Anonymous";
            var rating2 = rev.rating || "?";
            var dateText2 = rev.date ? new Date(rev.date).toLocaleDateString() : "";
            var comments2 = rev.comments && rev.comments.trim()
                ? rev.comments.trim()
                : "No comments provided.";
            var li = document.createElement("li");
            li.innerHTML =
                "<strong>" + title2 + "</strong><br>" +
                "Rating: " + rating2 + " / 5 by " + name2 +
                (dateText2 ? " on " + dateText2 : "") + "<br>" +
                '<span class="latest-review-comment">' + comments2 + "</span>";
            latestList.appendChild(li);
        }
    }
}

// ===============================
// ABOUT PAGE MODAL
// ===============================

/**
 * Initialize the contact modal on the About page.
 * @return {void}
 */
function setupContactModal() {
    var btn = document.getElementById("contactBtn");
    var overlay = document.getElementById("overlay");
    var modal = document.getElementById("contactModal");
    if (!btn || !overlay || !modal) {
        return;
    }
    btn.onclick = function () {
        overlay.style.display = "block";
        modal.style.display = "block";
    };
    overlay.onclick = function (event) {
        if (event.target === overlay) {
            overlay.style.display = "none";
            modal.style.display = "none";
        }
    };
}

// ===============================
// MAIN ENTRY POINT
// ===============================

document.addEventListener("DOMContentLoaded", function () {
    setupAdminCode();
    setupMoviesPage();
    setupSubmitReviewPage();
    setupBrowseReviewsPage();
    setupHomePage();
    setupContactModal();
});

