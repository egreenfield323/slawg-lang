import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Property,
  Stmt,
  StringLiteral,
  TryCatchStatement,
  VarDeclaration,
} from "./ast";
import { Token, tokenize, TokenType } from "./lexer";

export default class Parser {
  private tokens: Token[] = [];

  private not_eof(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  private at() {
    return this.tokens[0] as Token;
  }

  private eat() {
    const prev = this.tokens.shift() as Token;
    return prev;
  }

  private expect(type: TokenType, err: any) {
    const prev = this.tokens.shift() as Token;
    if (!prev || prev.type != type) {
      console.error("Parser Error:\n", err, prev, "Expecting: ", type);
      process.exit(1);
    }

    return prev;
  }

  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    const program: Program = {
      kind: "Program",
      body: [],
    };

    // parse until end of file
    while (this.not_eof()) {
      program.body.push(this.parse_stmt());
    }

    return program;
  }

  private parse_stmt(): Stmt {
    // skip to parse_expr
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parse_var_declaration();
      case TokenType.Fn:
        return this.parse_fn_declaration();
      case TokenType.If:
        return this.parse_if_statement();
      case TokenType.For:
        return this.parse_for_statement();
      default:
        return this.parse_expr();
    }
  }

  parse_block_statement(): Stmt[] {
    this.expect(
      TokenType.OpenBrace,
      'Opening brace ("{") expected while parsing code block.',
    );

    const body: Stmt[] = [];

    while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
      const stmt = this.parse_stmt();
      body.push(stmt);
    }

    this.expect(
      TokenType.CloseBrace,
      'Closing brace ("}") expected while parsing code block.',
    );

    return body;
  }

  parse_for_statement(): Stmt {
    this.eat(); // eat "for" keyword
    this.expect(
      TokenType.OpenParen,
      'Opening parenthesis ("(") expected following "for" statement.',
    );
    const init = this.parse_var_declaration();
    const test = this.parse_expr();

    this.expect(
      TokenType.Semicolon,
      'Semicolon (";") expected following "test expression" in "for" statement.',
    );

    const update = this.parse_assignment_expr();

    this.expect(
      TokenType.CloseParen,
      'Closing parenthesis ("(") expected following "additive expression" in "for" statement.',
    );

    const body = this.parse_block_statement();

    return {
      kind: "ForStatement",
      init,
      test,
      update,
      body,
    } as ForStatement;
  }

  parse_if_statement(): Stmt {
    this.eat(); // eat if keyword
    this.expect(
      TokenType.OpenParen,
      'Opening parenthesis ("(") expected following "if" statement.',
    );

    const test = this.parse_expr();

    this.expect(
      TokenType.CloseParen,
      'Closing parenthesis ("(") expected following "if" statement.',
    );

    const body = this.parse_block_statement();

    let alternate: Stmt[] = [];

    if (this.at().type == TokenType.Else) {
      this.eat(); // eat "else"

      if (this.at().type == TokenType.If) {
        alternate = [this.parse_if_statement()];
      } else {
        alternate = this.parse_block_statement();
      }
    }

    return {
      kind: "IfStatement",
      body: body,
      test,
      alternate,
    } as IfStatement;
  }

  parse_fn_declaration(): Stmt {
    this.eat(); // eats the fn keyword
    const name = this.expect(
      TokenType.Identifier,
      "Expected function name following fn keyword",
    ).value;

    const args = this.parse_args();
    const params: string[] = [];
    for (const arg of args) {
      if (arg.kind !== "Identifier") {
        console.log(arg);
        throw "Inside function declaration, expected parameters to be of type string.";
      }

      params.push((arg as Identifier).symbol);
    }

    const body = this.parse_block_statement();

    const fn = {
      body,
      name,
      parameters: params,
      kind: "FunctionDeclaration",
    } as FunctionDeclaration;

    return fn;
  }

  // LET IDENT
  // ( LET | CONST ) IDENT = EXPR;
  parse_var_declaration(): Stmt {
    const isConstant = this.eat().type == TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following let | const keywords.",
    ).value;

    if (this.at().type == TokenType.Semicolon) {
      this.eat(); // expect semicolon
      if (isConstant) {
        throw "Must assign value to constant expression. No value provided.";
      }

      return {
        kind: "VarDeclaration",
        identifier,
        constant: false,
      } as VarDeclaration;
    }

    this.expect(
      TokenType.Equals,
      "Expected equals token following identifier in var declaration.",
    );

    const declaration = {
      kind: "VarDeclaration",
      value: this.parse_expr(),
      identifier,
      constant: isConstant,
    } as VarDeclaration;

    if (this.at().type == TokenType.String) this.eat(); // eat ending quotation

    this.expect(
      TokenType.Semicolon,
      "Variable declaration statement must end with a semicolon.",
    );

    return declaration;
  }

  private parse_expr(): Expr {
    return this.parse_assignment_expr();
  }

  private parse_assignment_expr(): Expr {
    const left = this.parse_object_expr();

    if (this.at().type == TokenType.Equals) {
      this.eat(); // advance past equals
      const value = this.parse_assignment_expr();
      return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr;
    }

    return left;
  }

  private parse_and_statement(): Expr {
    let left = this.parse_additive_expr();

    if (["&&", "|"].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parse_additive_expr();

      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parse_try_catch_expr(): Expr {
    if (this.at().value !== "try") {
      return this.parse_and_statement();
    }

    this.eat();

    const body = this.parse_block_statement();

    if (this.at().value !== "catch") {
      throw '"try" statement must be followed by a "catch" statement.';
    }

    this.eat();

    const alternate = this.parse_block_statement();

    return {
      kind: "TryCatchStatement",
      body,
      alternate,
    } as TryCatchStatement;
  }

  private parse_object_expr(): Expr {
    // { Prop[] }
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parse_additive_expr();
    }

    this.eat(); // advance past open brace.
    const properties = new Array<Property>();

    while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
      const key = this.expect(
        TokenType.Identifier,
        "Object literal key expected",
      ).value;

      // allows shorthand key: pair -> key
      if (this.at().type == TokenType.Comma) {
        this.eat(); // advance past comma
        properties.push(
          { key, kind: "Property" } as Property,
        );
        continue;
      } // allows shorthand key: pair -> { key }
      else if (this.at().type == TokenType.CloseBrace) {
        properties.push(
          { key, kind: "Property" },
        );
        continue;
      }

      // { key: val }
      this.expect(
        TokenType.Colon,
        "Missing colon following identifier in ObjectExpr",
      );
      const value = this.parse_expr();

      properties.push({ kind: "Property", value, key });
      if (this.at().type !== TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          "Expected comma or closing bracket following property",
        );
      }
    }

    this.expect(TokenType.CloseBrace, "Object literal missing closing brace.");
    return { kind: "ObjectLiteral", properties } as ObjectLiteral;
  }

  private parse_additive_expr(): Expr {
    let left = this.parse_multiplicative_expr();

    while (["+", "-", "==", "!=", "<", ">"].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parse_multiplicative_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parse_multiplicative_expr(): Expr {
    let left = this.parse_call_member_expr();

    while (["/", "*", "%"].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parse_call_member_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parse_call_member_expr(): Expr {
    const member = this.parse_member_expr();

    if (this.at().type == TokenType.OpenParen) {
      return this.parse_call_expr(member);
    }

    return member;
  }

  private parse_call_expr(caller: Expr): Expr {
    let call_expr: Expr = {
      kind: "CallExpr",
      caller,
      args: this.parse_args(),
    } as CallExpr;

    if (this.at().type == TokenType.OpenParen) {
      call_expr = this.parse_call_expr(call_expr);
    }

    return call_expr;
  }

  private parse_args(): Expr[] {
    this.expect(
      TokenType.OpenParen,
      'Opening parenthesis ("(") expected while parsing arguments.',
    );
    const args = this.at().type == TokenType.CloseParen
      ? []
      : this.parse_arguments_list();

    this.expect(
      TokenType.CloseParen,
      'Closing parenthesis (")") expected while parsing arguments.',
    );
    return args;
  }

  private parse_arguments_list(): Expr[] {
    const args = [this.parse_expr()];

    while (this.at().type == TokenType.Comma && this.eat()) {
      args.push(this.parse_assignment_expr());
    }

    return args;
  }

  private parse_member_expr(): Expr {
    let object = this.parse_primary_expr();

    while (
      this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
    ) {
      const operator = this.eat();
      let property: Expr;
      let computed: boolean;

      // non-computed values aka dot.expr
      if (operator.type == TokenType.Dot) {
        computed = false;
        // get identifier
        property = this.parse_primary_expr();

        if (property.kind !== "Identifier") {
          throw `Cannot use dot operator without right hand side being an identifier`;
        }
      } else { // this allows obj[computedValue] (chaining)
        computed = true;
        property = this.parse_expr();
        this.expect(
          TokenType.CloseBracket,
          "Missing closing bracket in computed value.",
        );
      }
      object = {
        kind: "MemberExpr",
        object,
        property,
        computed,
      } as MemberExpr;
    }

    return object;
  }

  private parse_primary_expr(): Expr {
    const tk = this.at().type;

    switch (tk) {
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.eat().value } as Identifier;
      case TokenType.Number:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.eat().value),
        } as NumericLiteral;
      case TokenType.OpenParen: {
        this.eat(); // eat opening paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseParen,
          "Unexpected token found inside parenthesised expression. Expected closing parenthesis.",
        ); // closing paren
        return value;
      }
      case TokenType.String:
        return {
          kind: "StringLiteral",
          value: this.eat().value,
        } as StringLiteral;

      default:
        console.error("Unexpected token found during parsing!", this.at());
        process.exit(1);
    }
  }
}
