import subprocess, sys
comp, out, *fs = sys.argv[1:]
args = []
for f in fs: args += ['-i', f'out/stills/{comp}-{f}.png']
n = len(fs)
w = 300 if 'x16' in comp and comp.endswith('9x16') else 480
flt = ''.join(f'[{i}]scale={w}:-1[a{i}];' for i in range(n))
cols = 6
rows = (n + cols - 1) // cols
flt += ''.join(f'[a{i}]' for i in range(n)) + f'xstack=inputs={n}:layout=' + '|'.join(f'{(i%cols)}*{w}_{(i//cols)}*h0' if False else '' for i in range(n))
# simpler: build layout manually
lay = []
for i in range(n):
    x = '+'.join(['w0'] * (i % cols)) or '0'
    y = '+'.join(['h0'] * (i // cols)) or '0'
    lay.append(f'{x}_{y}')
flt = ''.join(f'[{i}]scale={w}:-1[a{i}];' for i in range(n)) + ''.join(f'[a{i}]' for i in range(n)) + (f'xstack=inputs={n}:layout=' + '|'.join(lay) + ':fill=gray' if n > 1 else 'null')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', flt, out], check=True)
