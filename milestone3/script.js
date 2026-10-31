let books = [];
let currentPage = 1;

const RESULTS_PER_PAGE = 10;
const detailCache = {};

const NO_COVER =
    "https://via.placeholder.com/120x180?text=No+Cover";

$(document).ready(function () {
    loadCollection();

    $("#btnSearch").on("click", searchBooks);

    $("#searchTerm").on("keypress", function (e) {
        if (e.which === 13) {
            searchBooks();
        }
    });
});

function searchBooks() {
    const term = $("#searchTerm").val().trim();

    if (!term) {
        $("#statusMessage").text("Please enter a search term.");
        return;
    }

    $("#statusMessage").text("Loading books...");
    $("#btnSearch").prop("disabled", true);

    $.ajax({
        url: `https://openlibrary.org/search.json?q=${encodeURIComponent(term)}`,
        method: "GET",

        success: function (data) {
            books = data.docs.slice(0, 50);
            currentPage = 1;

            if (books.length === 0) {
                $("#resultsContainer").html("<p>No matching books found.</p>");
                $("#pagination").empty();
                $("#pageIndicator").empty();
                return;
            }

            renderResults();
            buildPagination();
            $("#statusMessage").text("");
        },

        error: function () {
            $("#statusMessage").text("Unable to search books.");
        },

        complete: function () {
            $("#btnSearch").prop("disabled", false);
        }
    });
}

function renderResults() {
    $("#resultsContainer").empty();

    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;

    books.slice(start, end).forEach(book => {

        const cover =
            book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : NO_COVER;

        const authors =
            book.author_name
                ? book.author_name.join(", ")
                : "Unknown Author";

        $("#resultsContainer").append(`
            <div class="book-card"
                 data-work="${book.key}"
                 data-author="${authors}">
                 
                <img src="${cover}"
                     alt="${book.title}"
                     loading="lazy">

                <p>${book.title}</p>

            </div>
        `);
    });

    updatePageIndicator();
}

function buildPagination() {
    $("#pagination").empty();

    const totalPages =
        Math.ceil(
            books.length / RESULTS_PER_PAGE
        );

    for (let i = 1; i <= totalPages; i++) {
        $("#pagination").append(`
            <button
                class="pageBtn ${i === currentPage ? "activePage" : ""}"
                data-page="${i}">
                ${i}
            </button>
        `);
    }
}

function updatePageIndicator() {
    const totalPages =
        Math.ceil(
            books.length / RESULTS_PER_PAGE
        );

    $("#pageIndicator").text(
        `Page ${currentPage} of ${totalPages}`
    );
}

$(document).on(
    "click",
    ".pageBtn",
    function () {
        currentPage =
            parseInt(
                $(this).data("page")
            );

        renderResults();
        buildPagination();
    }
);

$(document).on(
    "click",
    ".book-card",
    function () {

        const workID =
            $(this).data("work");

        const authors =
            $(this).data("author");

        getBookDetails(
            workID,
            authors
        );
    }
);

function getBookDetails(workID, authors) {

    if (detailCache[workID]) {
        renderDetails(
            detailCache[workID],
            authors
        );
        return;
    }

    $("#bookDetails")
        .html("<p>Loading details...</p>");

    $.ajax({
        url: `https://openlibrary.org${workID}.json`,
        method: "GET",

        success: function (data) {
            detailCache[workID] = data;
            renderDetails(
                data,
                authors
            );
        },

        error: function () {
            $("#bookDetails")
                .html("<p>Unable to load details.</p>");
        }
    });
}

function renderDetails(book, authors) {

    let description =
        "No description available.";

    if (
        typeof book.description === "string"
    ) {
        description = book.description;
    } else if (
        book.description &&
        book.description.value
    ) {
        description = book.description.value;
    }

    const subjects =
        book.subjects
            ? book.subjects
                  .slice(0, 10)
                  .join(", ")
            : "No subjects available.";

    const cover =
        book.covers &&
        book.covers.length > 0
            ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
            : NO_COVER;

    $("#bookDetails").html(`
        <img src="${cover}"
             alt="${book.title}">

        <div class="detail-text">

            <h3>${book.title}</h3>

            <p>
                <strong>Work ID:</strong>
                ${book.key}
            </p>

            <p>
                <strong>Author(s):</strong>
                ${authors}
            </p>

            <p>
                <trong><br>
                ${subjects}
            </p>

            <p>
                https://openlibrary.org${book.key}
                   View on Open Library
                </a>
            </p>

        </div>
    `);
}

function loadCollection() {

    $.ajax({
        url: "https://openlibrary.org/subjects/fantasy.json?limit=10",
        method: "GET",

        success: function (data) {
            displayCollection(data.works);
        },

        error: function () {
            $("#collectionContainer").html(
                "<p>Collection unavailable.</p>"
            );
        }
    });
}

function displayCollection(collectionBooks) {

    $("#collectionContainer").empty();

    collectionBooks.forEach(book => {

        const cover =
        book.cover_id
        ? `<img
                src="https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg"
                alt="${book.title}"
                class="book-cover"
           >`
        : `<img
                src="${NO_COVER}"
                alt="No Cover Available"
                class="book-cover"
           >`;

        const authors =
            book.authors
                ? book.authors.map(a => a.name).join(", ")
                : "Unknown Author";

        $("#collectionContainer").append(`
    <div class="book-card"
         data-work="${book.key}"
         data-author="${authors}">

        ${cover}

        <p>${book.title}</p>

    </div>
`);
    });
}
