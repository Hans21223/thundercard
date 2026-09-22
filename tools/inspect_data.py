with open('extracted_game/lang/lang.vromfs.bin_u/lang/units.csv', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('"us_hstv_l'):
            parts = line.strip().split(';')
            print(parts[0], '==>', parts[1] if len(parts) > 1 else '')
