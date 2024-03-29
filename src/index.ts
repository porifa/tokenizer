'use strict';

export type triviaDataType = { text?: string; lastSkippable?: boolean };

export class Token<TokenKind, triviaType extends triviaDataType = {}> {
    public kind: TokenKind;
    public start: number;
    public length: number;
    public triviaData?: triviaType;

    constructor(kind: TokenKind, start: number, length: number, triviaData?: triviaType) {
        this.kind = kind;
        this.start = start;
        this.length = length;
        this.triviaData = triviaData;
    }

    public getText(source: string) {
        return source.substring(this.start, this.start + this.length);
    }
}

type TokenDefinition<TokenKind> = { regex: RegExp; kind?: TokenKind; tokenMap: Record<string, TokenKind> };

export class Tokenizer<TokenKind, triviaType extends triviaDataType = {}> {
    private _code: string = '';
    private _length: number = 0;
    private _position: number = 0;
    private _lastSkippable: Token<TokenKind> | null = null;

    constructor(
        private _tokenDefinitions: TokenDefinition<TokenKind>[],
        private _skippables: TokenKind[],
        private _endOfFile: TokenKind,
        private _unrecognized: TokenKind,
        private _triviaFunction?: (
            matchedToken: Token<TokenKind>,
            tokenizer: Tokenizer<TokenKind, triviaType>
        ) => triviaType
    ) {}

    public setInput(code: string) {
        this._code = code;
        this._length = code.length;
    }

    public setOffset(offset: number) {
        this._position = offset;
    }

    public isEndOfFile(): boolean {
        return this._position >= this._length;
    }

    public peekToken(upto: number = 1): Token<TokenKind> {
        const pos = this._position;
        let token = this.nextToken();

        for (let i = 1; i < upto; i++) {
            token = this.nextToken();
            if (token.kind === this._endOfFile) {
                break;
            }
        }

        this.setOffset(pos);
        return token;
    }

    public nextToken(): Token<TokenKind> {
        if (this.isEndOfFile()) {
            return new Token(this._endOfFile, this._position, this._length - this._position);
        }

        for (const tokenDefinition of this._tokenDefinitions) {
            const match: Token<TokenKind> | null = this._regexMatch(tokenDefinition);

            if (match === null) {
                continue;
            }

            if (this._isSkippable(match.kind)) {
                this._lastSkippable = match;
                return this.nextToken();
            }

            if (this._triviaFunction) {
                match.triviaData = this._triviaFunction(match, this);
            }

            if (this._lastSkippable !== null) {
                this._lastSkippable = null;
            }

            return match;
        }

        const pos = this._position;
        this._position++;

        return new Token(this._unrecognized, pos, this._position - pos);
    }

    public advanceIfRegex(regex: RegExp): string {
        const str = this._code.substring(this._position);
        const match = str.match(regex);
        if (match) {
            this._position = this._position + match.index! + match[0].length;
            return match[0];
        }
        return '';
    }

    public advanceUntilRegex(regex: RegExp) {
        const str = this._code.substring(this._position);
        const match = str.match(regex);
        if (match) {
            this._position = this._position + match.index!;
            return match.index!;
        }
        const pos = this._position;
        this._position = this._length;

        return this._length - pos;
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

        return new Token(kind, pos, matches[0].length);
    }

    private _isSkippable(type: TokenKind): boolean {
        return this._skippables.indexOf(type) !== -1;
    }

    public static buildRegexFromSpecialCharacters(
        specialChars: string[],
        prefix: string = '',
        suffix: string = '',
        flags?: string | undefined
    ): RegExp {
        const escapedChars = specialChars.map((char) => char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const specialCharsPattern = escapedChars.join('|');
        return new RegExp(`${prefix}(${specialCharsPattern})${suffix}`, flags);
    }
}
