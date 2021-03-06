//
//  The MIT License
//
//  Copyright (C) 2016-Present Shota Matsuda
//
//  Permission is hereby granted, free of charge, to any person obtaining a
//  copy of this software and associated documentation files (the "Software"),
//  to deal in the Software without restriction, including without limitation
//  the rights to use, copy, modify, merge, publish, distribute, sublicense,
//  and/or sell copies of the Software, and to permit persons to whom the
//  Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//  DEALINGS IN THE SOFTWARE.
//

import { compile } from 'glslify'
import { createFilter } from 'rollup-pluginutils'
import { dirname } from 'path'
import { Readable } from 'stream'
import deparser from 'glsl-deparser'
import parser from 'glsl-parser'
import tokenizer from 'glsl-tokenizer/stream'

function minify(glsl) {
  return new Promise((resolve, reject) => {
    let result = ''
    const stream = new Readable()
    stream
      .pipe(tokenizer())
      .pipe(parser())
      .pipe(deparser(false))
      .on('data', buffer => result += buffer.toString())
      .on('end', () => resolve(result))
    stream.push(glsl)
    stream.push(null)
  })
}

export default function glslify(options = {}) {
  const filter = createFilter(
    options.include || '**/*.+(glsl|vert|frag)',
    options.exclude)

  return {
    name: 'glslify',

    async transform(code, id) {
      if (!filter(id)) {
        return null
      }
      let source = compile(code, {
        basedir: options.basedir || dirname(id),
        transform: options.transform,
      })
      if (options.minify) {
        const minified = await minify(source)
        if (!minified) {
          console.warn('Failed to minify:', id)
        } else {
          source = minified
        }
      }
      const transformedCode = `export default ${JSON.stringify(source)};`
      return {
        code: transformedCode,
        map: { mappings: '' },
      }
    },
  }
}
