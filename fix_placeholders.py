import re

path = '/Users/mallenspach/Projects/zweitsprache/src/app/admin/textgenerator/niveauregeln/page.tsx'
with open(path, 'r') as f:
    content = f.read()

# Pattern A: single-line isInherited ternary (inherited first, own second)
# e.g.  const commentValue = isInherited ? (inheritedComments[x] ?? "") : (comments[x] ?? "");
def repl_a(m):
    indent = m.group(1)
    inh = m.group(2)
    own = m.group(3)
    return f'{indent}const commentValue = {own};\n{indent}const inheritedPlaceholder = {inh};'

content = re.sub(
    r'( +)const commentValue = isInherited \? \(([^)]+)\) : \(([^)]+)\);',
    repl_a,
    content
)

# Pattern B: multi-line hasOwnX ternary (own first, inherited second)
# e.g.  const commentValue = hasOwnKasus\n      ? (levelData.X[k] ?? "")\n      : (inherited.X[k] ?? "");
def repl_b(m):
    indent = m.group(1)
    own = m.group(2)
    inh = m.group(3)
    return f'{indent}const commentValue = {own};\n{indent}const inheritedPlaceholder = {inh};'

content = re.sub(
    r'( +)const commentValue = has\w+\n\s+\? \(([^)]+)\)\n\s+: \(([^)]+)\);',
    repl_b,
    content
)

with open(path, 'w') as f:
    f.write(content)

decl_count = content.count('const inheritedPlaceholder')
usage_count = content.count('placeholder={inheritedPlaceholder}')
print(f"declarations: {decl_count}, usages: {usage_count}")
