const RESULTS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let currentPage = 1;
let currentSearch = "";
let currentDocs = [];

$(document).ready(function () {

    loadCollection();

    $("#gridBtn").addClass("active-view");

    $("#searchForm").submit(function (e) {
        e.preventDefault();

        currentSearch = $("#searchInput").val().trim();

        if (!currentSearch) return;

        currentPage = 1;

        searchBooks();
    });

    $("#gridBtn").click(function () {

        $("#gridBtn").addClass("active-view");
        $("#listBtn").removeClass("active-view");

        $("#results")
            .removeClass("list-view")
            .addClass("grid-view");

        $("#collectionResults")
            .removeClass("list-view")
            .addClass("grid-view");
    });

    $("#listBtn").click(function () {

        $("#listBtn").addClass("active-view");
        $("#gridBtn").removeClass("active-view");

        $("#results")
            .removeClass("grid-view")
            .addClass("list-view");

        $("#collectionResults")
            .removeClass("grid-view")
            .addClass("list-view");
    });

    $("#nextBtn").click(function () {

        const totalPages = Math.ceil(
            Math.min(currentDocs.length, MAX_RESULTS) /
            RESULTS_PER_PAGE
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderSearchResults();
        }
    });

    $("#prevBtn").click(function () {

        if (currentPage > 1) {
            currentPage--;
            renderSearchResults();
        }
    });

});

/* -----------------------------
   Spinner
--------------------------------*/

function showSpinner() {
    $("#spinner").removeClass("hidden");
}

function hideSpinner() {
    $("#spinner").addClass("hidden");
}

/* -----------------------------
   Author Lookup
--------------------------------*/

async function getAuthors(authorKeys) {

    if (!authorKeys || authorKeys.length === 0) {
        return "Unknown Author";
    }

    try {

        const requests = authorKeys.map(author =>
            $.getJSON(
                `https://openlibrary.org${author.author.key}.json`
            )
        );

        const authors = await Promise.all(requests);

        return authors
            .map(author => author.name)
            .join(", ");

    } catch {

        return "Unknown Author";
    }
}

/* -----------------------------
   Search Books
--------------------------------*/

function searchBooks() {

    showSpinner();

    $.ajax({

        url: `https://openlibrary.org/search.json?q=${encodeURIComponent(currentSearch)}`,

        method: "GET",

        success: function (data) {

            currentDocs = data.docs.slice(0, MAX_RESULTS);

            renderSearchResults();

            hideSpinner();
        },

        error: function () {

            hideSpinner();

            $("#results").html(
                "<p>Unable to retrieve search results.</p>"
            );
        }

    });
}

/* -----------------------------
   Render Search Results
--------------------------------*/

function renderSearchResults() {

    $("#results").empty();

    const template = $("#book-template").html();

    const startIndex =
        (currentPage - 1) * RESULTS_PER_PAGE;

    const books =
        currentDocs.slice(
            startIndex,
            startIndex + RESULTS_PER_PAGE
        );

    books.forEach(book => {

        const view = {

            title:
                book.title || "No Title Available",

            author:
                book.author_name
                    ? book.author_name.join(", ")
                    : "Unknown Author",

            cover:
                book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : "https://via.placeholder.com/180x260?text=No+Cover",

            key:
                book.key
        };

        $("#results").append(
            Mustache.render(template, view)
        );

    });

    const totalPages = Math.ceil(
        Math.min(currentDocs.length, MAX_RESULTS) /
        RESULTS_PER_PAGE
    );

    $("#pageInfo").text(
        `Page ${currentPage} of ${totalPages || 1}`
    );
}

/* -----------------------------
   Collection
--------------------------------*/

function loadCollection() {

    showSpinner();

    $.ajax({

        url: "https://openlibrary.org/subjects/science_fiction.json?limit=10",

        method: "GET",

        success: function (data) {

            const template =
                $("#book-template").html();

            $("#collectionResults").empty();

            data.works.forEach(book => {

                const view = {

                    title: book.title,

                    author:
                        book.authors &&
                        book.authors.length > 0
                            ? book.authors[0].name
                            : "Unknown Author",

                    cover:
                        book.cover_id
                            ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
                            : "https://via.placeholder.com/180x260?text=No+Cover",

                    key: book.key
                };

                $("#collectionResults").append(
                    Mustache.render(template, view)
                );
            });

            hideSpinner();
        },

        error: function () {

            hideSpinner();

            $("#collectionResults").html(
                "<p>Unable to load collection.</p>"
            );
        }

    });
}

/* -----------------------------
   Book Details
--------------------------------*/

$(document).on("click", ".book-card", function () {

    const workKey = $(this).data("key");

    showSpinner();

    $.ajax({

        url: `https://openlibrary.org${workKey}.json`,

        method: "GET",

        success: async function (data) {

            const template =
                $("#details-template").html();

            const authorNames =
                await getAuthors(data.authors);

            const details = {

                title:
                    data.title || "No Title Available",

                workId:
                    workKey,

                authors:
                    authorNames,

                description:
                    typeof data.description === "object"
                        ? data.description.value
                        : data.description ||
                          "No description available.",

                language:
                    data.languages
                        ? `${data.languages.length} language(s)`
                        : "Not specified",

                cover:
                    data.covers &&
                    data.covers.length > 0
                        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
                        : "https://via.placeholder.com/250x350?text=No+Cover",

                subjects:
                    data.subjects
                        ? data.subjects.slice(0, 10)
                        : ["No subjects available"],

                link:
                    `https://openlibrary.org${workKey}`
            };

            $("#bookDetails").html(
                Mustache.render(
                    template,
                    details
                )
            );

            hideSpinner();
        },

        error: function () {

            hideSpinner();

            $("#bookDetails").html(
                "<p>Unable to load book details.</p>"
            );
        }

    });
});
