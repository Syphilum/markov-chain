import random
import re

class MarkovBot:
    def __init__(self, order=2):
        self.order = order
        self.transitions = {}
        self.start_nodes = []

    def train(self, text):
        words = re.findall(r"[\w']+|[.,!?;:]", text.lower())
        if len(words) < self.order:
            return

        self.start_nodes.append(tuple(words[:self.order]))
        
        for i in range(len(words) - self.order):
            state = tuple(words[i:i + self.order])
            next_word = words[i + self.order]
            
            if state not in self.transitions:
                self.transitions[state] = []
            self.transitions[state].append(next_word)
            
            if words[i] == '.' and i + self.order < len(words):
                self.start_nodes.append(tuple(words[i+1 : i+1+self.order]))

    def generate(self, prompt=None, length=20):
        if not self.transitions:
            return "Bot belum dilatih!"

        # Jika ada input dari user (prompt), gunakan sebagai awal
        if prompt:
            prompt_words = re.findall(r"[\w']+|[.,!?;:]", prompt.lower())
            if len(prompt_words) >= self.order:
                # Ambil N kata terakhir dari prompt sebagai state awal
                current_state = tuple(prompt_words[-self.order:])
                result = list(prompt_words)
            else:
                # Jika prompt terlalu pendek, cari state yang diawali kata tersebut
                possible_starts = [s for s in self.transitions.keys() if s[0] == prompt_words[-1]]
                if possible_starts:
                    current_state = random.choice(possible_starts)
                    result = list(prompt_words) + list(current_state[1:])
                else:
                    # Jika tidak ada yang cocok, mulai acak
                    current_state = random.choice(self.start_nodes)
                    result = list(current_state)
        else:
            current_state = random.choice(self.start_nodes)
            result = list(current_state)

        # Proses generasi
        for _ in range(length):
            if current_state in self.transitions:
                next_word = random.choice(self.transitions[current_state])
                result.append(next_word)
                current_state = tuple(result[-self.order:])
                if next_word == '.' and len(result) > 10:
                    break
            else:
                break # Berhenti jika tidak ada kelanjutan yang diketahui

        text = " ".join(result)
        text = re.sub(r'\s+([.,!?;:])', r'\1', text)
        if text and text[-1] not in '.!?;':
            text += '.'
        return text.capitalize()
