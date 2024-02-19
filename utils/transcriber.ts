declare global {
  interface String {
    replace_fr(target: string, replacement: string): string;
  }
}

String.prototype.replace_fr = function (
  target: string,
  replacement: string,
): string {
  const pattern = new RegExp(
    `\\b${target}\\b(?=(?:(?:[^"]*"){2})*[^"]*$)`,
    "g",
  );

  return this.replace(pattern, replacement);
};

export function transcribe(code: string) {
  return code
    .replace_fr("oppositiate", '!')
    .replace_fr("fr", ";")
    .replace_fr("equivalate to", "=")
    .replace_fr("permit", "let")
    .replace_fr("no_change", "const")
    .replace_fr("spitbars", "print")
    .replace_fr("si", "if")
    .replace_fr("nothin", "null")
    .replace_fr("si_no", "else")
    .replace_fr("dont_fw", "!=")
    .replace_fr("fw", "==")
    .replace_fr("moreover", "&&")
    .replace_fr("carenot", "|")
    .replace_fr("street", "fn")
    .replace_fr("einstein", "math")
    .replace_fr("foh", "for")
    .replace_fr("diesto", "<")
    .replace_fr("kills", ">")
    .replace_fr("yuh", "true")
    .replace_fr("nuh", "false")
    .replace_fr("frick_around", "try")
    .replace_fr("find_out", "catch")
    .replace_fr("pullup", "exec")
    .replace_fr("talk", "input")
    .replace_fr("minus", "-")
    .replace_fr("plus", "+")
    .replace_fr("minusminus", "--")
    .replace_fr("plusplus", "++")
    .replace_fr("times", "*")
    .replace_fr("divided by", "/")
    .replace(/\: number/g, "")
    .replace(/\: string/g, "")
    .replace(/\: object/g, "")
    .replace(/\: boolean/g, "");
}
