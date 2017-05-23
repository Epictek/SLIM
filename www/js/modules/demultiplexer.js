
class DemultiplexerModule extends Module {
	constructor () {
		super ("demultiplexer");

		this.out_files = [];
	}

	onFileChange (file_manager, event) {
		/* Select elements for autocomplete fields */
		var elements = file_manager.getFiles();
		var fastq  = [];
		var fasta  = [];
		var csv  = [];
		for (var idx in elements) {
			var filename = elements[idx];

			if (filename.endsWith('.fastq')
					|| filename.endsWith('.fastq.gz')
					|| filename.endsWith('.fastq.bz2'))
				fastq.push({value:filename, data:filename});
			else if (filename.endsWith('fasta'))
				fasta.push({value:filename, data:filename});
			else if (filename.endsWith('csv'))
				csv.push({value:filename, data:filename});
		}

		/* Change the autocomplete field */
		// Input fastq
		var that = this;
		$(this.r1_text).autocomplete({
			lookup: fastq,
			onSelect: function(suggestion) {
				that.r1_text.value = suggestion.data;
			}
		});
		$(this.r2_text).autocomplete({
			lookup: fastq,
			onSelect: function(suggestion) {
				that.r2_text.value = suggestion.data;
			}
		});

		// Input tags
		$(this.tags_text).autocomplete({
			lookup: csv,
			onSelect: function(suggestion) {
				that.tags_text.value = suggestion.data;
			}
		});

		// Input primers
		$(this.primers_text).autocomplete({
			lookup: fasta,
			onSelect: function(suggestion) {
				that.primers_text.value = suggestion.data;
			}
		});
	}

	onLoad () {
		var that = this;

		// Register to the file manager
		file_manager.register_observer(function (man, event) {
			that.onFileChange(man, event);
		});

		// Define things
		this.defineIO();
	}

	defineIO () {
		// Save inputs
		var inputs = this.dom.getElementsByTagName('input');
		this.r1_text = inputs[0];
		this.r2_text = inputs[1];
		this.tags_text = inputs[2];
		this.primers_text = inputs[3];

		this.out_area = this.dom.getElementsByTagName('textarea')[0];

		// Load suggestions in the inputs
		this.onFileChange(file_manager, {});
		
		var that = this;
		// Change the output files using the tags file
		this.tags_text.onchange = function () {
			that.out_files = [];

			var data = file_manager.contents[that.tags_text.value].data;
			for (var idx=0 ; idx<data.length ; idx++) {
				var sample = data[idx];

				// Add the run with joker
				if (that.out_files.indexOf(sample.run + "*_fwd.fastq") == -1) {
					that.out_files.push(sample.run + "*_fwd.fastq");
					that.out_files.push(sample.run + "*_rev.fastq");
				}

				// Add the sample outfiles
				that.out_files.push(sample.run + "_" + sample.sample + "_fwd.fastq");
				that.out_files.push(sample.run + "_" + sample.sample + "_rev.fastq");
			}

			// Add the files in the output text area
			that.out_area.innerHTML = "";
			for (var idx=0 ; idx<that.out_files.length ; idx++) {
				that.out_area.innerHTML += that.out_files[idx] + "\n";
			}

			// Notify the files manager
			event = new Event('new_output');
			event.files = that.out_files;
			document.dispatchEvent(event);
		}
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.r1 = this.r1_text.value;
		config.inputs.r2 = this.r2_text.value;
		config.inputs.tags = this.tags_text.value;
		config.inputs.primers = this.primers_text.value;

		for (var idx=0 ; idx<this.out_files.length ; idx++) {
			var filename = this.out_files[idx];
			config.outputs[filename] = filename;
		}
		
		return config;
	}
};