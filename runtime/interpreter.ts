import { NumberVal, RuntimeVal, StringVal } from "./values";
import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Stmt,
  StringLiteral,
  TryCatchStatement,
  VarDeclaration,
} from "../frontend/ast";
import Environment from "./environment";
import {
  eval_assignment,
  eval_binary_expr,
  eval_call_expr,
  eval_identifier,
  eval_member_expr,
  eval_object_expr,
} from "./eval/expressions";
import {
  eval_for_statement,
  eval_function_declaration,
  eval_if_statement,
  eval_program,
  eval_try_catch_statement,
  eval_var_declaration,
} from "./eval/statements";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: ((astNode as NumericLiteral).value),
        type: "number",
      } as NumberVal;
    case "StringLiteral":
      return {
        value: ((astNode as StringLiteral).value),
        type: "string",
      } as StringVal;
    case "Identifier":
      return eval_identifier(astNode as Identifier, env);
    case "ObjectLiteral":
      return eval_object_expr(astNode as ObjectLiteral, env);
    case "CallExpr":
      return eval_call_expr(astNode as CallExpr, env);
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env);
    case "AssignmentExpr":
      return eval_assignment(astNode as AssignmentExpr, env);
    case "Program":
      return eval_program(astNode as Program, env);
    case "MemberExpr":
      return eval_member_expr(env, undefined, astNode as MemberExpr);

      // handle statements
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env);
    case "FunctionDeclaration":
      return eval_function_declaration(astNode as FunctionDeclaration, env);
    case "TryCatchStatement":
      return eval_try_catch_statement(env, astNode as TryCatchStatement);
    case "IfStatement":
      return eval_if_statement(astNode as IfStatement, env);
    case "ForStatement":
      return eval_for_statement(astNode as ForStatement, env);
    default:
      console.error(
        "This AST node has not yet been setup for interpretation\n",
        astNode,
      );
      process.exit(0);
  }
}
