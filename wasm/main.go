package main

import (
	"syscall/js"

	"github.com/pdfcpu/pdfcpu/pkg/api"
)

func init() {
	api.DisableConfigDir()
}

func main() {
	js.Global().Set("pdfPageCount", js.FuncOf(pageCount))
	js.Global().Set("pdfSplit", js.FuncOf(split))
	<-make(chan struct{})
}
