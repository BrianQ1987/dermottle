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
    actor_name <- content(details, as = "parsed")$name
    actor_info[[actor_name]] <- content(details, as = "parsed")
    
    credits <- GET(paste0(api_base_url, "person/", id, "/movie_credits?api_key=", api_key))
    actor_data[[actor_name]] <- content(credits, as = "parsed")
  }, error = function(e) {
    cat("Error fetching actor details:\n", e$message, "\n")
  })
  
  actor_info[[actor_name]]$profile_path <- paste0(image_base_url, actor_info[[actor_name]]$profile_path)
  actor_info[[actor_name]]$popularity <- NULL
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
        director <- paste(sort(director), collapse = " and ")
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
    
    if (grepl(actor, movie$overview)) {
      movie$overview <- gsub(actor, "***** *****", movie$overview)
    }
    
    surname <- sub(".* ", "", actor)
    if (grepl(surname, movie$overview)) {
      movie$overview <- gsub(surname, "*****", movie$overview)
    }
    
    genres <- c()
    if (length(movie_info$genres) > 0) {
      for (i in 1:length(movie_info$genres)) {
        genres <- c(genres, movie_info$genres[[i]]$name)
      }
    }
    
    if (movie$release_date != "") {
      movie_data[[as.character(movie$id)]] <- list(
        title = movie$title,
        answer = actor,
        character = movie$character,
        poster_path = paste0(image_base_url, movie$poster_path),
        release_date = substr(movie$release_date, 1, 4),
        overview = movie$overview,
        director = director,
        co_star_1 = co_star_1,
        co_star_2 = co_star_2,
        imdb = movie_info$imdb_id,
        genres = genres
      )
    }
  
  }
}

# Write the processed movies to a new JSON file
write_json(movie_data, "movies.json", auto_unbox = TRUE, pretty = TRUE)

# Read picks from a JSON file
tryCatch({
  picks <- fromJSON("picks.json")
}, error = function(e) {
  cat("Error loading picks.json:\n", e$message, "\n")
})

# Date to make a pick for
date <- today() + 2

# Pick horror movies for lead up to Halloween
horror_movies <- list()
for (i in 1:length(movie_data)) {
  if ("Horror" %in% movie_data[[i]]$genres) {
    horror_movies[[names(movie_data[i])]] <- movie_data[[i]]
  }
}

horror_ids <- sample(names(horror_movies), length(horror_movies))
horror_dates <- (32 - length(horror_movies)):31

# Pick Christmas movies

xmas_movies <- list()
for (i in 1:length(movie_data)) {
  if (grepl("Christmas|Holidays|Santa", movie_data[[i]]$title) | grepl("Christmas|Holidays|Santa|holidays", movie_data[[i]]$overview)) {
    xmas_movies[[names(movie_data[i])]] <- movie_data[[i]]
  }
}

xmas_ids <- sample(names(xmas_movies), length(xmas_movies))
xmas_dates <- (26 - length(xmas_movies)):25

# Romantic comedies
romcoms <- list()
for (i in 1:length(movie_data)) {
  if ("Romance" %in% movie_data[[i]]$genres & "Comedy" %in% movie_data[[i]]$genres & !names(movie_data[i]) %in% names(xmas_movies)) {
    romcoms[[names(movie_data[i])]] <- movie_data[[i]]
  }
}

romcom_ids <- sample(names(romcoms), length(romcoms))

romcom_dates <- if (length(romcoms) %% 2 == 1) {
  (14 - floor(length(romcoms) / 2)):(14 + floor(length(romcoms) / 2))
} else {
  (14 - length(romcoms) / 2):(13 + length(romcoms) / 2)
}


if (month(date) == 10 & day(date) == horror_dates[1]) {
  for (i in 1:length(horror_dates)) {
    picks[[paste0(year(date),"-10-", sprintf("%02d", horror_dates[i]))]] <- horror_ids[i]  
  }
} else if (month(date) == 12 & day(date) == xmas_dates[1]) {
  for (i in 1:length(xmas_dates)) {
    picks[[paste0(year(date),"-12-", sprintf("%02d", xmas_dates[i]))]] <- xmas_ids[i]  
  }
} else if (month(date) == 2 & day(date) == romcom_dates[1]) {
  for (i in 1:length(romcom_dates)) {
    picks[[paste0(year(date),"-02-", sprintf("%02d", romcom_dates[i]))]] <- romcom_ids[i]  
  }
} else {
  if (!as.character(date) %in% names(picks)) {
    picks[[as.character(date)]] <- sample(names(movie_data), 1)
  }
}

write_json(picks, "picks.json", auto_unbox = TRUE, pretty = TRUE)
