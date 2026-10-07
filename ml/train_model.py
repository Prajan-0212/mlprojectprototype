"""
LoanLens - train the Random Forest loan approval model.

Usage:  python ml/train_model.py
Input:  ml/data/loan_data.csv   (public Loan Prediction dataset, 614 rows)
Output: src/data/model.json      (trees + metrics, used by the web app for in-browser prediction)

Gender is intentionally excluded from the features to avoid encoding gender bias.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "ml" / "data" / "loan_data.csv"
OUT = ROOT / "src" / "data" / "model.json"

FEATURES = [
    "Married", "Dependents", "Graduate", "Self_Employed", "ApplicantIncome",
    "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term", "Credit_History",
    "Area_Rural", "Area_Semiurban", "Area_Urban",
]


def preprocess(df: pd.DataFrame):
    df = df.copy()
    medians = {}
    for col in ["LoanAmount", "Loan_Amount_Term", "ApplicantIncome", "CoapplicantIncome"]:
        medians[col] = float(df[col].median())
        df[col] = df[col].fillna(medians[col])
    for col in ["Married", "Dependents", "Self_Employed", "Credit_History", "Education", "Property_Area"]:
        df[col] = df[col].fillna(df[col].mode()[0])
    X = pd.DataFrame({
        "Married": (df["Married"] == "Yes").astype(int),
        "Dependents": df["Dependents"].astype(str).str.replace("+", "", regex=False).astype(int),
        "Graduate": (df["Education"] == "Graduate").astype(int),
        "Self_Employed": (df["Self_Employed"] == "Yes").astype(int),
        "ApplicantIncome": df["ApplicantIncome"],
        "CoapplicantIncome": df["CoapplicantIncome"],
        "LoanAmount": df["LoanAmount"],
        "Loan_Amount_Term": df["Loan_Amount_Term"],
        "Credit_History": df["Credit_History"].astype(int),
        "Area_Rural": (df["Property_Area"] == "Rural").astype(int),
        "Area_Semiurban": (df["Property_Area"] == "Semiurban").astype(int),
        "Area_Urban": (df["Property_Area"] == "Urban").astype(int),
    })[FEATURES]
    y = (df["Loan_Status"] == "Y").astype(int)
    return X, y, medians


def export_tree(est):
    t = est.tree_
    # probability of class 1 (approved) at every node
    vals = t.value[:, 0, :]
    p = (vals[:, 1] / vals.sum(axis=1)).round(5).tolist()
    return {
        "f": t.feature.tolist(),
        "t": [round(float(x), 4) for x in t.threshold],
        "l": t.children_left.tolist(),
        "r": t.children_right.tolist(),
        "p": p,
    }


def main():
    df = pd.read_csv(DATA)
    X, y, medians = preprocess(df)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=60, max_depth=6, min_samples_leaf=4, random_state=42)
    model.fit(X_tr, y_tr)
    pred = model.predict(X_te)
    cm = confusion_matrix(y_te, pred, labels=[0, 1]).tolist()
    metrics = {
        "accuracy": accuracy_score(y_te, pred),
        "precision": precision_score(y_te, pred),
        "recall": recall_score(y_te, pred),
        "f1": f1_score(y_te, pred),
        "confusion": cm,  # rows = actual [rejected, approved], cols = predicted
        "train_size": int(len(X_tr)),
        "test_size": int(len(X_te)),
        "approval_rate": float(y.mean()),
    }
    out = {
        "features": FEATURES,
        "importances": [round(float(v), 5) for v in model.feature_importances_],
        "medians": medians,
        "metrics": {k: (round(v, 4) if isinstance(v, float) else v) for k, v in metrics.items()},
        "params": {"n_estimators": 60, "max_depth": 6, "min_samples_leaf": 4, "test_size": 0.2, "random_state": 42},
        "dataset": {"rows": int(len(df)), "name": "Loan Prediction (public, 614 rows)"},
        "trees": [export_tree(e) for e in model.estimators_],
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(json.dumps(out["metrics"], indent=2))
    print(dict(zip(FEATURES, out["importances"])))


if __name__ == "__main__":
    main()
