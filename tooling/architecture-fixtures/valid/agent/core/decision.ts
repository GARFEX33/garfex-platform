export type Decision = Readonly<{
  action: "continue" | "stop";
}>;

export const decide = (ready: boolean): Decision => ({
  action: ready ? "continue" : "stop",
});
