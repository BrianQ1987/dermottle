# Load necessary libraries
library(jsonlite)
library(httr)
library(dplyr)
library(lubridate)

# Configuration
api_key <- '91d04f3f962aeb346fde58d53a9594ca'
api_base_url <- 'https://api.themoviedb.org/3/'
image_base_url <- 'https://image.tmdb.org/t/p/w1280'
actor_ids <- c(20212, 32597)

# Fetch actor details from TMDB
actor_data <- list()
actor_info <-list()

for (id in actor_ids) {
  tryCatch({
    details <- GET(paste0(api_base_url, "person/", id, "?api_key=", api_key))
    actor_info[[content(details, as = "parsed")$name]] <- content(details, as = "parsed")
    
    credits <- GET(paste0(api_base_url, "person/", id, "/movie_credits?api_key=", api_key))
    actor_data[[content(details, as = "parsed")$name]] <- content(credits, as = "parsed")
  }, error = function(e) {
    cat("Error fetching actor details:\n", e$message, "\n")
  })
  
  actor_info[[content(details, as = "parsed")$name]]$profile_path <- paste0(image_base_url, actor_info[[content(details, as = "parsed")$name]]$profile_path)
}

write_json(actor_info, "actors.json", auto_unbox = TRUE, pretty = TRUE)

movie_data <- list()

for (actor in names(actor_data)) {
  for (movie in actor_data[[actor]]$cast) {
    
    movie_credits <- list()
    
    # Fetch info from TMDB
    tryCatch({
      response2 <- GET(paste0(api_base_url, "movie/", movie$id, "?api_key=", api_key))
      movie_info <- content(response2, as = "parsed")
    }, error = function(e) {
      cat("Error fetching movie info:\n", e$message, "\n")
    })
    
    # Fetch credits from TMDB
    tryCatch({
      response3 <- GET(paste0(api_base_url, "movie/", movie$id, "/credits?api_key=", api_key))
      movie_credits <- content(response3, as = "parsed")
    }, error = function(e) {
      cat("Error fetching movie credits:\n", e$message, "\n")
    })
    
    director <- c()
    if (!is.null(movie_credits$crew)) {
      for (crew_member in movie_credits$crew) {
        if (crew_member$job == "Director") {
          director <- c(director, crew_member$name)
        }
      }
    }
    
    if (!is.null(director)) {
      if (length(director) > 1) {
        director <- paste(director, collapse = " and ")
      }
    }
    
    if (length(movie_credits$cast) > 2) {
      co_star_1 <- if (movie_credits$cast[[1]]$name == actor) movie_credits$cast[[2]]$name else movie_credits$cast[[1]]$name
      co_star_2 <- if (actor %in% c(movie_credits$cast[[1]]$name, movie_credits$cast[[2]]$name)) movie_credits$cast[[3]]$name else movie_credits$cast[[2]]$name
    } else if (length(movie_credits$cast) == 2) {
      co_star_1 <- if (movie_credits$cast[[1]]$name == actor) movie_credits$cast[[2]]$name else movie_credits$cast[[1]]$name
      co_star_2 <- "None"
    } else {
      co_star_1 <- "None"
      co_star_2 <- "None"
    }
    
    movie_data[[as.character(movie$id)]] <- list(title = movie$title,
                                                 answer = actor,
                                                 character = movie$character,
                                                 poster_path = paste0(image_base_url, movie$poster_path),
                                                 release_date = substr(movie$release_date, 1, 4),
                                                 overview = movie$overview,
                                                 director = director,
                                                 co_star_1 = co_star_1,
                                                 co_star_2 = co_star_2,
                                                 imdb = movie_info$imdb_id)
  }
}

# Write the processed movies to a new JSON file
write_json(movie_data, "movies.json", auto_unbox = TRUE, pretty = TRUE)


# Read picks from a JSON file
tryCatch({
  picks <- fromJSON("picks.json")
}, error = function(e) {
  cat("Error loading ansers.json:\n", e$message, "\n")
})

picks[[as.character(today() + 2)]] <- names(movie_data[sample(1:length(movie_data), size = 1)])

write_json(picks, "picks.json", auto_unbox = TRUE, pretty = TRUE)
