package main

import (
	"syscall/js"

	_ "github.com/pdfcpu/pdfcpu/pkg/api" // keep dep until SplitRaw lands
)

// Scaffold stubs — pdfcpu SplitRaw + progress callback land in a later task.

func pageCount(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return 0
	}
	return 0
}

func split(_ js.Value, args []js.Value) any {
	return js.Global().Get("Array").New()
}
