const RESULTS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let currentPage = 1;
let currentSearch = "";
let currentDocs = [];

$(document).ready(function () {

    loadCollection();

    $("#searchForm").submit(function (e) {

        e.preventDefault();

        currentSearch = $("#searchInput").val().trim();

        currentPage = 1;

        searchBooks();
    });

    $("#gridBtn").click(function () {

        $("#results")
            .removeClass("list-view")
            .addClass("grid-view");

        $("#collectionResults")
            .removeClass("list-view")
            .addClass("grid-view");
    });

    $("#listBtn").click(function () {

        $("#results")
            .removeClass("grid-view")
            .addClass("list-view");

        $("#collectionResults")
            .removeClass("grid-view")
            .addClass("list-view");
    });

    $("#nextBtn").click(function () {

        const totalPages =
            Math.ceil(
                Math.min(currentDocs.length, MAX_RESULTS)
                / RESULTS_PER_PAGE
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


function searchBooks() {

    $("#loading").text("Loading...");

    $.ajax({

        url:
        `https://openlibrary.org/search.json?q=${encodeURIComponent(currentSearch)}`,

        method:"GET",

        success:function(data){

            currentDocs = data.docs.slice(0,50);

            renderSearchResults();

            $("#loading").text("");

        },

        error:function(){

            $("#loading").text("Error loading search results.");

        }

    });

}


function renderSearchResults() {

    $("#results").empty();

    const template = $("#book-template").html();

    const start = (currentPage - 1) * RESULTS_PER_PAGE;

    const books =
        currentDocs.slice(start,start + RESULTS_PER_PAGE);

    books.forEach(book => {

        const view = {

            title:
                book.title || "No title available",

            author:
                book.author_name
                ? book.author_name[0]
                : "Unknown Author",

            cover:
                book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : "https://via.placeholder.com/180x260?text=No+Cover",

            key:
                book.key
        };

        $("#results").append(
            Mustache.render(template,view)
        );

    });

    const totalPages =
        Math.ceil(
            Math.min(currentDocs.length,50)
            / RESULTS_PER_PAGE
        );

    $("#pageInfo").text(
        `Page ${currentPage} of ${totalPages}`
    );
}


function loadCollection() {

    $.ajax({

        url:
        "https://openlibrary.org/subjects/science_fiction.json?limit=10",

        method:"GET",

        success:function(data){

            const template =
                $("#book-template").html();

            data.works.forEach(book=>{

                const view = {

                    title:book.title,

                    author:
                        book.authors?.length
                        ? book.authors[0].name
                        : "Unknown",

                    cover:
                        book.cover_id
                        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
                        : "https://via.placeholder.com/180x260?text=No+Cover",

                    key:book.key

                };

                $("#collectionResults").append(
                    Mustache.render(template,view)
                );

            });

        }
    });
}


$(document).on("click",".book-card",function(){

    const workKey = $(this).data("key");

    $.ajax({

        url:`https://openlibrary.org${workKey}.json`,

        method:"GET",

        success:function(data){

            const template =
                $("#details-template").html();

            const details = {

                title:
                    data.title ||
                    "No title available",

                workId:
                    workKey,

                authors:
                    "Information unavailable",

                description:
                    typeof data.description === "object"
                    ? data.description.value
                    : data.description ||
                    "No description available.",

                language:
                    data.languages
                    ? "Available"
                    : "Not specified",

                cover:
                    data.covers?.length
                    ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
                    : "https://via.placeholder.com/250x350?text=No+Cover",

                subjects:
                    data.subjects
                    ? data.subjects.slice(0,10)
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

        },

        error:function(){

            $("#bookDetails").html(
                "<p>Unable to load book details.</p>"
            );

        }

    });

});
