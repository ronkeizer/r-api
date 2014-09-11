## Load libraries
sink (file="tmp.out") # awkward workaround since suppressMessages() / try() does not suppress all messages for some libraries
library(rjson) # needed for output back to JSON
sink (file=NULL)

## parse arguments
args_cli <- commandArgs(trailingOnly = TRUE)
args <- list()
for (i in seq(args_cli)) {
  tmp <- strsplit(args_cli[i], "=")[[1]]
  args[[as.character(tmp[1])]] <- as.character(tmp[2])
}

## actual functionality
samp <- runif(args$n_samp)

## output JSON object back to server
out <- list(n_samp = args$n_samp, samp = samp)
cat(toJSON(out))
quit()
