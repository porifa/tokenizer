# @porifa/tokenizer

A Regex Based Tokenizer for Parsers

## Description

This package provides a flexible and efficient tokenizer that utilizes regular expressions to break down text into tokens for parsing. It's primarily designed for use within parsers developed by [Porifa](https://github.com/porifa), but can be adapted for other parsing tasks as well.

## Features

-   **Regex-based tokenization**: Define token patterns using regular expressions for precise control.
-   **Token types**: Assign a unique type to each token for identification and processing.
-   **Trivia handling**: Attach additional data to tokens, such as comments or whitespace, for custom handling.
-   **Skippable tokens**: Specify token types to be ignored during parsing.
-   **Customizable tokenization logic**: Inject custom tokenization logic through a trivia function.
-   **EOF handling**: Detects the end of the input stream.
-   **Peeking**: Preview upcoming tokens without consuming them.
-   **Utility functions**: Build regular expressions from special characters for convenience.

## Installation

```bash
npm install @porifa/tokenizer
```

## Usage

1. **Import the Tokenizer class**:

```ts
import { Tokenizer, TokenDefinition } from '@porifa/tokenizer';
```

2. **Define token definitions**:

```ts
enum TokenKind {
    EOF = 'eof',
    UNRECOGNIZED = 'unrecognized',
    WHITESPACE = 'whitespace',
    IDENTIFIER = 'identifier',

    IF = 'if',
    ELSE = 'else',
    WHILE = 'while',
    FOR = 'for',
    SEMICOLON = ',',
}

const keywordMap: Record<string, TokenKind> = {
    if: TokenKind.IF,
    else: TokenKind.ELSE,
    while: TokenKind.WHILE,
    for: TokenKind.FOR,
};

const tokenDefinitions: TokenDefinition<TokenKind>[] = [
    { regex: /if|else|while|for/, tokenMap: keywordMap },
    { regex: /[a-zA-Z_][a-zA-Z0-9_]*/, tokenMap: {}, kind: TokenKind.IDENTIFIER },
    { regex: /\s+/, tokenMap: {}, kind: TokenKind.WHITESPACE },
    // ... more token definitions
];
```

3. **Create a tokenizer instance**:

```ts
const tokenizer = new Tokenizer<TokenKind, { text: string }>(
    tokenDefinitions,
    [TokenKind.WHITESPACE],
    TokenKind.EOF,
    TokenKind.UNRECOGNIZED,
    (token, tokenizer) => ({ text: tokenizer.code.substring(token.start, token.start + token.length) })
);
```

4. **Provide input code**:

```ts
tokenizer.setInput(code);
```

5. **Iterate through tokens**:

```ts
while (!tokenizer.isEndOfFile()) {
    const token = tokenizer.nextToken();
    console.log(token.kind, token.triviaData?.text);
}
```

## Additional Information

-   Explore the Token and Tokenizer classes for detailed properties and methods.
-   Refer to the examples directory for usage in different parsing scenarios.
-   Consider contributing to the package for enhancements and bug fixes.

## Contributing

We welcome contributions to this package! Please follow our contribution guidelines.

## License

This package is licensed under the MIT License.
