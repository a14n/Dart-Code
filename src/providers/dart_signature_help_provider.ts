"use strict";

import { SignatureHelpProvider, SignatureHelp, SignatureInformation, ParameterInformation, TextDocument, Location, Uri, Position, CancellationToken, CompletionItemProvider, CompletionList, CompletionItem, CompletionItemKind, TextEdit, Range } from "vscode";
import { Analyzer } from "../analysis/analyzer";
import * as as from "../analysis/analysis_server_types";
import * as util from "../utils";

export class DartSignatureHelpProvider implements SignatureHelpProvider {
	private analyzer: Analyzer;
	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Promise<SignatureHelp> {
		return new Promise<SignatureHelp>((resolve, reject) => {
			this.analyzer.analysisGetHover({
				file: document.fileName,
				// TODO: This needs to handle walking back to the correct place if it's a "," or whatever...
				offset: document.offsetAt(position) - 1 // HACK: Subtract one to get back to before the bracket to get info from method/constructor
			}).then(resp => {
				// Bail if we got no sensible repsonse.
				if (!resp.hovers || resp.hovers.length == 0)
					resolve(null);

				let hover = resp.hovers[0];

				// Bail if we don't have a signature to parse.
				if (!hover.elementDescription)
					resolve(null);

				// elementDescription will be in the form "method(Type1 name1, Type2 name2) → Type" 
				let desc = hover.elementDescription;
				let startPos = desc.indexOf('(');
				let endPos = desc.lastIndexOf('→') - 1;
				let signatureInfo = desc.substring(startPos, endPos).trim();

				let sigInfo = new SignatureInformation(hover.dartdoc);
				sigInfo.parameters = [new ParameterInformation(signatureInfo)];
				sigInfo.parameters[0].documentation = "WIP...";

				let sig = new SignatureHelp();
				sig.activeParameter = 0;
				sig.signatures = [sigInfo];

				console.log(JSON.stringify(sig));

				resolve(sig);
			});
		});
	}
}


