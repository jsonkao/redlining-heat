library(foreign)
library(jsonlite)
suppressPackageStartupMessages(library(dplyr))

# Read in data

data <- inner_join(
  read.dbf('../data/holc-shapefile/holc_ad_data.dbf'),
  fromJSON('../data/temperatures.json'),
  by = c('neighborho' = 'id')
) %>%
  rename(holc_grade = holc_grade.x) %>%
  filter(holc_grade != 'E') %>%
  select(state, city, holc_grade, temperature)

# Define function for outputting test result as dataframe

runTukey <- function(arg) {
  as.data.frame(TukeyHSD(aov(
    temperature ~ holc_grade, data = data %>% filter(city == arg)
  ))$holc_grade)
}

# Apply tests to named list of dataframes; output JSON

toJSON(sapply(
  gsub('_', ' ', commandArgs(trailingOnly = TRUE)),
  runTukey,
  simplify = FALSE,
  USE.NAMES = TRUE
))
