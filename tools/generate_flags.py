import os

flags = os.listdir('public/assets/game/flags')
flags.sort()

major_ids = ['usa', 'germany', 'ussr', 'britain', 'japan', 'china', 'italy', 'france', 'sweden', 'israel']

lines = [
    "export interface FlagInfo {",
    "  id: string;",
    "  name: string;",
    "  path: string;",
    "  category: 'major' | 'minor' | 'variant' | 'event';",
    "}",
    "",
    "export const FLAGS: FlagInfo[] = ["
]

lines.append("  // Major Nations (Official In-Game Waving Tooltip Flags)")
for f in flags:
    id_name = f.replace('.avif', '').replace('country_', '')
    if id_name in major_ids:
        title = id_name.upper() if id_name in ['usa', 'ussr'] else id_name.title()
        lines.append(f"  {{ id: '{id_name}', name: '{title}', path: 'assets/game/flags/{f}', category: 'major' }},")

lines.append("  // Variants & Sub-Branches (Official Game Flags)")
for f in flags:
    id_name = f.replace('.avif', '').replace('country_', '')
    if id_name not in major_ids and any(v in id_name for v in ['modern', 'empire', 'navy', 'early', '19', 'republic', 'weimar']):
        title = id_name.replace('_', ' ').title()
        lines.append(f"  {{ id: '{id_name}', name: '{title}', path: 'assets/game/flags/{f}', category: 'variant' }},")

lines.append("  // Other Nations & Coalitions (Official Game Flags)")
for f in flags:
    id_name = f.replace('.avif', '').replace('country_', '')
    if id_name not in major_ids and not any(v in id_name for v in ['modern', 'empire', 'navy', 'early', '19', 'republic', 'weimar']):
        title = id_name.replace('_', ' ').title()
        lines.append(f"  {{ id: '{id_name}', name: '{title}', path: 'assets/game/flags/{f}', category: 'minor' }},")

lines.append("];")
lines.append("")
lines.append("export const getFlagById = (id: string): FlagInfo | undefined => {")
lines.append("  return FLAGS.find((f) => f.id === id);")
lines.append("};")
lines.append("")
lines.append("export const getFlagByPath = (path: string): FlagInfo | undefined => {")
lines.append("  return FLAGS.find((f) => f.path === path);")
lines.append("};")

with open('src/data/flags.ts', 'w', encoding='utf-8') as fp:
    fp.write('\n'.join(lines))
print('Successfully wrote src/data/flags.ts!')
