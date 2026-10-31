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
        $("#statusMessage").text(
            "Please enter a search term."
        );
        return;
    }

    $("#statusMessage").text(
        "Loading books..."
    );

    $("#btnSearch").prop(
        "disabled",
        true
    );

    $.ajax({

        url: `https://openlibrary.org/search.json?q=${encodeURIComponent(term)}`,

        method: "GET",

        success: function (data) {

            books = data.docs.slice(0, 50);

            currentPage = 1;

            if (books.length === 0) {

                $("#resultsContainer").html(
                    "<p>No matching books found.</p>"
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
                "Unable to search books."
            );
        },

        complete: function () {

            $("#btnSearch").prop(
                "disabled",
                false
            );
        }
    });
}

function 
