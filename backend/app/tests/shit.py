from collections import Counter
from uuid import uuid4

votes = [
    {"player_id": 1, "point": 0.2},
    {"player_id": 1, "point": 0.2},
    {"player_id": 2, "point": 0.2},
    {"player_id": 2, "point": 0.2},
]
cnt = Counter()  # initialize counter
# aggregate players votes points
for vote in votes:
    cnt[vote["player_id"]] += vote["point"]

# get the player with most votes
most_votes = cnt.most_common(1)[0]
# get the player with least votes
n = 1
least_votes = cnt.most_common()[: -n - 1 : -1][0]

if most_votes[1] == least_votes[1]:
    print("draw")
else:
    print(most_votes[0], "won")


print(most_votes, "+", least_votes, uuid4())
