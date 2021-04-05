library(foreign)
library(jsonlite)
library(ggplot2)
library(cowplot)
suppressPackageStartupMessages(library(dplyr))

# Read in data

cities <- commandArgs(trailingOnly = TRUE)

data <- inner_join(
  read.dbf('../data/holc-shapefile/holc_ad_data.dbf'),
  rbind(
    fromJSON('../data/task-exports/temperatures-2020.json'),
    fromJSON('../data/task-exports/temperatures-2000.json')
  ),
  by = c('neighborho' = 'id')
) %>%
  rename(holc_grade = holc_grade.x) %>%
  filter(holc_grade != 'E') %>%
  select(state, city, holc_grade, temperature, year)

WILDCARD <- 'nation'

# Define function for outputting test result as dataframe

runTukey <- function(arg) {
  output <- list()
  tkyPlots <- list()
  for (theYear in c(2000, 2020)) {
    filteredData <- data %>%
      filter(year == theYear) %>%
      filter(if (arg == WILDCARD) T else city %in% strsplit(arg, ',')[[1]]) %>%
      filter(!is.na(temperature)) %>%
      mutate(city = arg)

    if (nrow(filteredData) == 0)
      next
    tky <- as.data.frame(TukeyHSD(aov(
      temperature ~ holc_grade, data = filteredData
    ))$holc_grade)
    tky$pair <- rownames(tky)
    tkyPlots[[length(tkyPlots) + 1]] <-
      ggplot(tky, aes(colour = cut(
        `p adj`,
        c(0, 0.01, 0.05, 1),
        label = c("p < 0.01", "p < 0.05", "Non-Sig")
      ))) +
      geom_hline(yintercept = 0,
                 lty = "11",
                 colour = "grey30") +
      geom_errorbar(aes(pair, ymin = lwr, ymax = upr), width = 0.2) +
      geom_point(aes(pair, diff)) +
      labs(colour = "") +
      coord_flip() +
      theme_minimal_vgrid(12) +
      labs(y = 'Difference in temperature', x = 'Pair')
    output[[as.character(theYear)]] <- tky
  }
  
  if (length(tkyPlots) < 2) {
    tkyPlot <- tkyPlots[[1]]
  } else {
    tkyPlot <-
      plot_grid(tkyPlots[[1]], tkyPlots[[2]], labels = c('2000', '2020'))
  }
  
  plot <- data %>%
    filter(if (arg == WILDCARD) T else city %in% strsplit(arg, ',')[[1]]) %>%
    filter(!is.na(temperature)) %>%
    ggplot(aes(temperature, fill = holc_grade)) +
    geom_density(alpha = 0.6) +
    facet_grid(holc_grade ~ year, switch = "y", scales = "free_y") +
    theme_minimal_vgrid(12) +
    scale_y_continuous(expand = expansion(mult = c(0, 0.05))) +
    guides(fill = FALSE) +
    scale_fill_manual(values = c("#76a865", "#7cb5bd", "#ffff00", "#d9838d")) +
    theme(
      axis.line.y = element_blank(),
      axis.text.y = element_blank(),
      axis.ticks.y = element_blank(),
      axis.title.y = element_blank(),
      strip.text.y.left = element_text(angle = 0)
    ) +
    labs(x = 'Mean summertime temperature')
  if (arg == WILDCARD) {
    plot <- plot + coord_cartesian(xlim = c(40, 120))
  }

  ggsave(
    paste0(gsub(' ', '_', arg), '.png'),
    plot,
    device = 'png',
    path = 'charts/',
    width = 6.7,
    height = 5.5,
    units = 'in',
    dpi = 300
  )
  ggsave(
    paste0(gsub(' ', '_', arg), '-tky.png'),
    tkyPlot,
    device = 'png',
    path = 'charts/',
    width = 9,
    height = 4.5,
    units = 'in'
  )

  output
}

# Apply tests to named list of dataframes; output JSON

toJSON(sapply(
  gsub('_', ' ', cities),
  runTukey,
  simplify = FALSE,
  USE.NAMES = TRUE
))
