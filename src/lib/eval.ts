import { DefaultFunctions, type EvalFunction } from "../pattern";

export const evaluation = (evala: EvalFunction, properties: Map<string, string>): string => {
  const display = evala(DefaultFunctions(), properties);
  return typeof display === 'string' ? display : display.type
}