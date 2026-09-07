package main

import "syscall/js"

func main() {
	js.Global().Set("pdfPageCount", js.FuncOf(pageCount))
	js.Global().Set("pdfSplit", js.FuncOf(split))
	<-make(chan struct{})
}
