let picks;
let movies;
let actors;
let score_value = 0;
let playing = true;

async function renderGame() {

    try {
        const response = await fetch("picks.json");
        const responseData = await response.json();
        picks = responseData;
    } catch (error) {
        
    }

    try {
        const response = await fetch("movies.json");
        const responseData = await response.json();
        movies = responseData;
    } catch (error) {
        
    }

    try {
        const response = await fetch("actors.json");
        const responseData = await response.json();
        actors = responseData;
    } catch (error) {
        
    }

    let today = new Date;
    today = today.toISOString().split('T')[0]

    let movie = movies[picks[today]];

    document.getElementById("movie-title").innerHTML = "<i>" + movie.title + "</i>";

    let hints = document.getElementsByClassName("hint");

    for (let i = 0; i < hints.length; i ++) {

        hints[i].onclick = function () {

            if (!hints[i].classList.contains("revealed") && playing) {
                score_value += 1;
                document.getElementById("score").textContent = score_value;
            }

            hints[i].textContent = movie[hints[i].id];
            hints[i].classList.add("revealed");

        }
    }

    let buttons = document.getElementsByClassName("guess-button");
    let answer_screen = document.getElementById("answer-screen");

    for (let i = 0; i < buttons.length; i ++) {
        buttons[i].onclick = function () {

            if (playing) {
                playing = false;
                answer_screen.style.display = "block";
                document.getElementById("guess-panel").style.display = "none";
                document.getElementById("see-results").style.display = "block";

                if ((buttons[i].id == "dermot-button" &&  movie.answer == "Dermot Mulroney") || (buttons[i].id == "dylan-button" &&  movie.answer == "Dylan McDermott")) {
                    document.getElementById("result").textContent = "Correct";
                    document.getElementById("correct-answer").innerHTML = movie.answer + " starred in <em>" + movie.title + "</em>";
                    if (score_value == 0) {
                        document.getElementById("final-score").innerHTML = "You got the correct answer with zero hints";
                    } else if (score_value == 1) {
                        document.getElementById("final-score").innerHTML = "You got the correct answer with one hint";
                    } else {
                        document.getElementById("final-score").innerHTML = "You got the correct answer with " + score_value + " hints";
                    }
                } else {
                    document.getElementById("result").textContent = "Incorrect";
                    document.getElementById("correct-answer").textContent = "The correct answer is " + movie.answer;
                    document.getElementById("final-score").innerHTML = "Better luck next time!";
                }

                document.getElementById("actor-photo").innerHTML = "<img src = '" + actors[movie.answer].profile_path + "'>";
                document.getElementById("movie-poster").innerHTML = "<img src = '" + movie.poster_path + "'>";

            }
        }
    }

    document.getElementById("close-button").onclick = function() {
        answer_screen.style.display = "none";
    }

    document.getElementById("see-results").onclick = function() {
        answer_screen.style.display = "block";
    }

}

window.onload = renderGame;