'use strict';

export class Token<TokenKind> {
    public kind: TokenKind;
    public start: number;
    public length: number;

    constructor(kind: TokenKind, start: number, length: number) {
        this.kind = kind;
        this.start = start;
        this.length = length;
    }

    public static create<TokenKind>(kind: TokenKind, start: number, length: number) {
        return new Token(kind, start, length);
    }

    public getText(source: string) {
        return source.substring(this.start, this.start + this.length);
    }
}

type TokenDefinition<TokenKind> = { kind?: TokenKind; regex: RegExp; tokenMap: Record<string, TokenKind> };

export class Tokenizer<TokenKind> {
    private _code: string = '';
    private _length: number = 0;
    private _position: number = 0;

    constructor(
        private _tokenDefinitions: TokenDefinition<TokenKind>[],
        private _skippables: TokenKind[],
        private _endOfFile: TokenKind,
        private _unrecognized: TokenKind
    ) {}

    setInput(code: string) {
        this._code = code;
        this._length = code.length;
    }

    setOffset(offset: number) {
        this._position = offset;
    }

    nextToken(): Token<TokenKind> {
        if (this._position >= this._length) {
            return Token.create(this._endOfFile, this._position, this._length - this._position);
        }

        for (const tokenDefinition of this._tokenDefinitions) {
            let match: Token<TokenKind> | null = null;
            match = this._regexMatch(tokenDefinition);

            if (match === null) {
                continue;
            }

            if (this._isSkippable(match.kind)) {
                return this.nextToken();
            }

            return match;
        }
        const pos = this._position;
        this._position++;
        return Token.create(this._unrecognized, pos, this._position - pos);
    }

    private _regexMatch(definition: TokenDefinition<TokenKind>): Token<TokenKind> | null {
        const matches = this._code.substring(this._position).match(definition.regex);

        if (matches === null) {
            return null;
        }

        let kind: TokenKind | undefined = definition.kind ?? definition.tokenMap[matches[0].toLowerCase()];

        if (kind === undefined) {
            kind = this._unrecognized;
        }

        const pos = this._position;
        this._position += matches[0].length;

        return Token.create(kind, pos, matches[0].length);
    }

    private _isSkippable(type: TokenKind): boolean {
        return this._skippables.indexOf(type) !== -1;
    }
}
