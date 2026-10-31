// =============================
// Global Variables
// =============================

let books = [];
let currentPage = 1;
const resultsPerPage = 10;

const detailCache = {};

const NO_COVER =
    "https://via.placeholder.com/120x180?text=No+Cover";

// =============================
// Document Ready
// =============================

$(document).ready(function () {

    loadCollection();

    $("#btnSearch").on("click", searchBooks);

    $("#searchTerm").on("keypress", function (e) {

        if (e.which === 13) {
            searchBooks();
        }

    });

});

// =============================
// Search Books
// =============================

function searchBooks() {

    const searchTerm = $("#searchTerm")
        .val()
        .trim();

    if (searchTerm === "") {

        $("#statusMessage").text(
            "Please enter a search term."
        );

        return;
    }

    $("#statusMessage").text("Loading books...");

    $("#btnSearch").prop("disabled", true);

    $.ajax({

        url:
            `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}`,

        method: "GET",

        success: function (data) {

            books = data.docs.slice(0, 50);

            currentPage = 1;

            if (books.length === 0) {

                $("#resultsContainer").html(
                    "<p>No books found.</p>"
                );

                $("#pagination").empty();
                $("#pageIndicator").empty();

                return;
            }

            renderResults();
            buildPagination();

            $("#statusMessage").text("");

        },

        error: function () {

            $("#statusMessage").text(
                "Unable to retrieve search results."
            );

        },

        complete: function () {

            $("#btnSearch").prop("disabled", false);

        }

    });

}

// =============================
// Render Search Results
// =============================

function renderResults() {

    $("#resultsContainer").empty();

    const start =
        (currentPage - 1) * resultsPerPage;

    const end =
        start + resultsPerPage;

    const currentBooks =
        books.slice(start, end);

    currentBooks.forEach(book => {

        const coverURL =
            book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : NO_COVER;

        const card = `
            <div class="book-card"
                 data-work="${book.key}"
                 data-author="${book.author_name ? book.author_name.join(', ') : 'Unknown Author'}">

                <img src="${coverURL}"
                     alt="${book.title}">

                <p>${book.title}</p>

            </div>
        `;

        $("#resultsContainer").append(card);

    });

    updatePageIndicator();

}

// =============================
// Build Pagination
// =============================

function buildPagination() {

    $("#pagination").empty();

    const totalPages =
        Math.ceil(
            books.length / resultsPerPage
        );

    for (let i = 1; i <= totalPages; i++) {

        const button = $(`
            <button
                class="pageBtn ${i === currentPage ? 'activePage' : ''}"
                data-page="${i}">
                ${i}
            </button>
        `);

        $("#pagination").append(button);

    }

}

// =============================
// Pagination Click
// =============================

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

// =============================
// Page Indicator
// =============================

function updatePageIndicator() {

    const totalPages =
        Math.ceil(
            books.length / resultsPerPage
        );

    $("#pageIndicator").text(
        `Page ${currentPage} of ${totalPages}`
    );

}

// =============================
// Book Click
// =============================

$(document).on(
    "click",
    ".book-card",
    function () {

        const workKey =
            $(this).data("work");

        const author =
            $(this).data("author");

        getBookDetails(
            workKey,
            author
        );

    }
);

// =============================
// Get Book Details
// =============================

function getBookDetails(
    workKey,
    authorNames
) {

    if (detailCache[workKey]) {

        renderDetails(
            detailCache[workKey],
            authorNames
        );

        return;
    }

    $("#bookDetails").html(
        "<p>Loading details...</p>"
    );

    $.ajax({

        url: `https://openlibrary.org${workKey}.json`,

        method: "GET",

        success: function (data) {

            detailCache[workKey] = data;

            renderDetails(
                data,
                authorNames
            );

        },

        error: function () {

            $("#bookDetails").html(
                "<p>Unable to load book details.</p>"
            );

        }

    });

}

// =============================
// Render Details
// =============================

function renderDetails(
    book,
    authorNames
) {

    let description =
        "Description not available.";

    if (
        typeof book.description ===
        "string"
    ) {

        description =
            book.description;

    }

    if (
        typeof book.description ===
        "object" &&
        book.description !== null
    ) {

        description =
            book.description.value ||
            "Description not available.";
    }

    let subjects =
        "Subjects unavailable.";

    if (
        book.subjects &&
        book.subjects.length > 0
    ) {

        subjects =
            book.subjects
                .slice(0, 10)
                .join(", ");

    }

    let coverURL =
        NO_COVER;

    if (
        book.covers &&
        book.covers.length > 0
    ) {

        coverURL =
            `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`;

    }

    $("#bookDetails").html(`

        <img
            src="${coverURL}"
            alt="${book.title}">

        <div class="detail-text">

            <h3>${book.title}</h3>

            <p>
                <strong>Work ID:</strong>
                ${book.key}
            </p>

            <p>
                <strong>Author(s):</strong>
   n:</strong><br>
                ${description}
            </p>

            <p>
                <strong>Subjects:</strong><br>
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

// =============================
// Load Featured Collection
// =============================

function loadCollection() {

    $("#collectionContainer").html(
        "<p>Loading collection...</p>"
    );

    $.ajax({

        url:
            "https://openlibrary.org/subjects/fantasy.json?limit=10",

        method: "GET",

        success: function (data) {

            displayCollection(
                data.works
            );

        },

        error: function () {

            $("#collectionContainer").html(
                "<p>Collection unavailable.</p>"
            );

        }

    });

}

// =============================
// Display Collection
// =============================

function displayCollection(collectionBooks) {

    $("#collectionContainer").empty();

    if (
        !collectionBooks ||
        collectionBooks.length === 0
    ) {

        $("#collectionContainer").html(
            "<p>No collection available.</p>"
        );

        return;
    }

    collectionBooks.forEach(book => {

        const coverURL =
            book.cover_id
                ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
                : NO_COVER;

        const authors =
            book.authors
                ? book.authors
                      .map(author => author.name)
                      .join(", ")
                : "Unknown Author";

        const card = `
            <div class="book-card"
                 data-work="${book.key}"
                 data-author="${authors}">

                ${coverURL}

                <p>${book.title}</p>

            </div>
        `;

        $("#collectionContainer")
            .append(card);

    });

}
