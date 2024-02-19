export enum TokenType {
  // literals
  Number,
  Identifier,
  String,

  // keywords
  Let,
  Const,
  Fn,
  If,
  Else,
  For,

  // grouping / operators
  BinaryOperator,
  Equals, // =
  Comma, // ,
  Dot, // .
  Colon, // :
  Semicolon, // ;
  Quotation, // "
  Greater, // >
  Lesser, // <
  EqualsCompare, // ==
  NotEqualsCompare, // !=
  Exclamation, // !
  And, // &&
  Ampersand, // &
  Bar, // |
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  EOF, // signifies end of file (last char)
}

const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
  const: TokenType.Const,
  fn: TokenType.Fn,
  if: TokenType.If,
  else: TokenType.Else,
  for: TokenType.For,
};

const TOKEN_CHARS: Record<string, TokenType> = {
  "(": TokenType.OpenParen,
  ")": TokenType.CloseParen,
  "{": TokenType.OpenBrace,
  "}": TokenType.CloseBrace,
  "[": TokenType.OpenBracket,
  "]": TokenType.CloseBracket,
  "+": TokenType.BinaryOperator,
  "-": TokenType.BinaryOperator,
  "*": TokenType.BinaryOperator,
  "%": TokenType.BinaryOperator,
  "/": TokenType.BinaryOperator,
  "<": TokenType.Lesser,
  ">": TokenType.Greater,
  ".": TokenType.Dot,
  ";": TokenType.Semicolon,
  ":": TokenType.Colon,
  ",": TokenType.Comma,
  "|": TokenType.Bar,
  "!": TokenType.Exclamation,
};

export interface Token {
  value: string;
  type: TokenType;
}

function token(value = "", type: TokenType): Token {
  return { value, type };
}

function isalpha(src: string, isFirstChar = false) {
  if (isFirstChar) {
    return /^[A-Za-z_]+$/.test(src);
  }
  return /^[A-Za-z0-9_]+$/.test(src);
}

function isskippable(str: string) {
  return str == " " || str == "\n" || str == "\t" || str == "\r";
}

function isint(str: string) {
  const c = str.charCodeAt(0);
  const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
  return (c >= bounds[0] && c <= bounds[1]);
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = sourceCode.split("");

  // produce tokens until the EOF is reached.
  while (src.length > 0) {
    const char = src[0];

    const tokenType = TOKEN_CHARS[char];
    if (isint(char) || (char == "-" && isint(src[1]))) {
      let num = src.shift();
      let period = false;
      while (src.length > 0) {
        if (src[0] == "." && !period) {
          period = true;
          num += src.shift()!;
        } else if (isint(src[0])) {
          num += src.shift()!;
        } else break;
      }

      // append new numeric token.
      tokens.push(token(num, TokenType.Number));
    } else {
      switch (char) {
        case "=":
          src.shift();
          if (src[0] == "=") {
            src.shift();
            tokens.push(token("==", TokenType.EqualsCompare));
          } else {
            tokens.push(token("=", TokenType.Equals));
          }
          break;
        case "&":
          src.shift();
          if (src[0] == "&") {
            src.shift();
            tokens.push(token("&&", TokenType.And));
          } else {
            tokens.push(token("&", TokenType.Ampersand));
          }
          break;
        case "!":
          src.shift();
          if (String(src[0]) == "=") {
            src.shift();
            tokens.push(token("!=", TokenType.NotEqualsCompare));
          } else {
            tokens.push(token("!", TokenType.Exclamation));
          }
          break;
        case '"':
          let str = "";
          src.shift();

          while (src.length > 0 && src[0] !== '"') {
            str += src.shift();
          }

          src.shift();

          // append new string token.
          tokens.push(token(str, TokenType.String));
          break;
        case "-":
        case "+":
          if (src[1] == src[0]) {
            const prevtoken = tokens[tokens.length - 1];
            if (prevtoken != null) {
              tokens.push(token("=", TokenType.Equals));
              tokens.push(token(prevtoken.value, prevtoken.type));
              tokens.push(token(src.shift(), TokenType.BinaryOperator));
              tokens.push(token("1", TokenType.Number));
              src.shift();
            }
            break;
          }
        default:
          if (tokenType) {
            tokens.push(token(src.shift(), tokenType));
          } else if (isalpha(char, true)) {
            let ident = "";
            ident += src.shift(); // Add first character which is alphabetic or underscore

            while (src.length > 0 && isalpha(src[0])) {
              ident += src.shift(); // Subsequent characters can be alphanumeric or underscore
            }

            // CHECK FOR RESERVED KEYWORDS
            const reserved = KEYWORDS[ident];
            // If value is not undefined then the identifier is
            // recognized keyword
            if (typeof reserved == "number") {
              tokens.push(token(ident, reserved));
            } else {
              // Unrecognized name must mean user-defined symbol.
              tokens.push(token(ident, TokenType.Identifier));
            }
          } else if (isskippable(src[0])) {
            // Skip unneeded chars.
            src.shift();
          } else {
            // Handle unrecognized characters.
            // TODO: Implement better errors and error recovery.

            console.error(
              "Unrecognized character found in source: ",
              src[0].charCodeAt(0),
              src[0],
            );
            process.exit(1);
          }
          break;
      }
    }
  }

  tokens.push({ type: TokenType.EOF, value: "EndOfFile" });

  return tokens;
}
