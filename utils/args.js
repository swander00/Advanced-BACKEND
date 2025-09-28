export function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  
  return {
    limit: limitArg ? parseInt(limitArg) : null
  };
}