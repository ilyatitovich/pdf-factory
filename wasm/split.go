package main

import (
	"bytes"
	"io"
	"syscall/js"

	"github.com/pdfcpu/pdfcpu/pkg/api"
)

func copyBytes(v js.Value) []byte {
	b := make([]byte, v.Length())
	js.CopyBytesToGo(b, v)
	return b
}

func uint8ArrayFromBytes(b []byte) js.Value {
	u8 := js.Global().Get("Uint8Array").New(len(b))
	js.CopyBytesToJS(u8, b)
	return u8
}

func pageCount(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		panic("pdfPageCount: expected Uint8Array")
	}
	rs := bytes.NewReader(copyBytes(args[0]))
	n, err := api.PageCount(rs, nil)
	if err != nil {
		panic(err.Error())
	}
	return n
}

func split(_ js.Value, args []js.Value) any {
	if len(args) < 3 {
		panic("pdfSplit: expected (Uint8Array, span, progressFn)")
	}
	span := args[1].Int()
	progressFn := args[2]
	rs := bytes.NewReader(copyBytes(args[0]))

	spans, err := api.SplitRaw(rs, span, nil)
	if err != nil {
		panic(err.Error())
	}

	total := len(spans)
	out := js.Global().Get("Array").New(total)
	for i, ps := range spans {
		data, err := io.ReadAll(ps.Reader)
		if err != nil {
			panic(err.Error())
		}
		obj := js.Global().Get("Object").New()
		obj.Set("from", ps.From)
		obj.Set("thru", ps.Thru)
		obj.Set("bytes", uint8ArrayFromBytes(data))
		out.SetIndex(i, obj)
		progressFn.Invoke(i+1, total)
	}
	return out
}
