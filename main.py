from markov_gen import MarkovBot
import sys

def main():
    bot = MarkovBot(order=2)
    
    print("Sedang memuat dataset...")
    try:
        with open('dataset.txt', 'r') as f:
            data = f.read()
        bot.train(data)
    except FileNotFoundError:
        print("Error: dataset.txt tidak ditemukan!")
        return

    print("\n" + "="*40)
    print("MARKOV CHAIN TEXT COMPLETER")
    print("="*40)
    print("Ketik kalimat awal dan bot akan melanjutkannya.")
    print("Ketik '/train <teks>' untuk menambah pengetahuan bot.")
    print("Ketik 'keluar' atau 'exit' untuk berhenti.\n")

    while True:
        try:
            user_input = input("User > ").strip()
            
            if user_input.lower() in ['keluar', 'exit']:
                print("Sampai jumpa!")
                break
            
            if not user_input:
                continue

            # Fitur baru: Menambah dataset langsung
            if user_input.startswith('/train '):
                new_data = user_input[7:].strip()
                if new_data:
                    # Simpan ke file
                    with open('dataset.txt', 'a') as f:
                        f.write("\n" + new_data)
                    # Latih bot secara real-time
                    bot.train(new_data)
                    print(f"Bot  > Berhasil mempelajari data baru! (Total state: {len(bot.transitions)})\n")
                else:
                    print("Bot  > Mohon masukkan teks setelah perintah /train.\n")
                continue

            # Bot menghasilkan kelanjutan (limit 20 kata tambahan)
            hasil = bot.generate(prompt=user_input, length=20)
            print(f"Bot  > {hasil}\n")
            
        except KeyboardInterrupt:
            print("\nSampai jumpa!")
            break

if __name__ == "__main__":
    main()
