export function parseArgs() {
  const args = process.argv.slice(2);
  
  // Parse --limit=100
  const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  
  // Parse --type=VOW or --type=IDX
  const typeArg = args.find(arg => arg.startsWith('--type='))?.split('=')[1];
  
  return {
    limit: limitArg ? parseInt(limitArg) : null,
    syncType: typeArg && typeArg.toUpperCase() === 'VOW' ? 'VOW' : 'IDX'
  };
}