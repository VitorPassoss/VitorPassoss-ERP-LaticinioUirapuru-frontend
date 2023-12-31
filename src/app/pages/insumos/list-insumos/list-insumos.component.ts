import { Component, OnInit} from '@angular/core';

import { SharedService } from 'src/app/shared/shared.service';
import { InsumosService } from '../insumos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/shared/services/loading.service';

@Component({
  selector: 'app-list-insumos',
  templateUrl: './list-insumos.component.html',
  styleUrls: ['./list-insumos.component.scss']
})
export class ListInsumosComponent implements OnInit {
  MateriaPrima:any = []
  MaterialSelect: any[] = [];
  insumos: any[] = []
  fornecedores: any[] = []
  visible: boolean = false;
  quantidadeGrandeza:any = 0
  entradaForm: FormGroup

  entradaFiltrada: any[] = this.MateriaPrima;

  active :boolean = false
  calcOn: boolean = false
  dataSelect = ''

  constructor(
    public insumosService: InsumosService,
    public sharedService: SharedService,
    private formBuilder: FormBuilder,
    public loadingService:LoadingService,
    
  ){

    this.entradaForm = this.formBuilder.group({
      fornecedor: [null, Validators.required],
      tipo_insumo: ['Kg'],
      quantidade: [null, Validators.required],
      valor: [0.00],
      created_at: [this.getFormattedDate(new Date()), Validators.required]  
    })
  }

  ngOnInit() {
    this.getEntradas()
    this.getInsumos()
    this.getFornecedores()
    this.entradaFiltrada = [...this.MateriaPrima];
  }

  getFormattedDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  filtrarPorMesEAno(dataInput: string): void {
    this.active = true
    const [yearInput, monthInput] = dataInput.split('-').map(Number); // Convertendo as partes para números
    

    this.dataSelect = `${monthInput}/${yearInput}`

    this.entradaFiltrada = this.MateriaPrima.filter((item:any) => {
      const dataItem = new Date(item.created_at);
  
      const monthItem = dataItem.getMonth() + 1; // Os meses em JavaScript são base 0, por isso adicionamos 1.
      const yearItem = dataItem.getFullYear();
      
      return monthItem === monthInput && yearItem === yearInput;
    });
  }
  
  
  limparFiltro(): void {
    this.active = false
    this.entradaFiltrada = [...this.MateriaPrima];
  }
  
  
  async getEntradas(){
    this.loadingService.present()
    this.insumosService.getEntradas().subscribe(
      {
        next: async (res:any) => {
          console.log(res)
          this.MateriaPrima = res
          this.entradaFiltrada = [...this.MateriaPrima];
          this.loadingService.dismiss()
        },
        error: async (err:any) => {
          console.log(err)
          this.loadingService.dismiss()
          this.sharedService.showToastError("Falha ao carregar registros")
        }
      }
    )
  }


  async getInsumos(){
    this.insumosService.getInsumos().subscribe(
      {
        next: async(res) => {
          console.log(res)
          this.insumos = res
        },
        error: async(e) =>{
          this.sharedService.showToastError("Falha ao carregar insumos")
        }
      }
    )
  }


  async getFornecedores(){
    this.insumosService.getFornecedores().subscribe(
      {
        next: async(res) => {
          console.log(res)
          this.fornecedores = res
        }
      }
    )
  }

  onSelectionChange(event: any) {
    console.log(event)
    console.log(this.MaterialSelect)
  }

  showAddInsumo() {
    this.visible = true;
    this.getEntradas()
    this.getInsumos()
    this.getFornecedores()
}


submitForm() {
  this.loadingService.present()
  if (this.entradaForm.valid) { // check if the form is valid
      const formData = this.entradaForm.value; // get the form data
      console.log(formData)


      this.insumosService.createEntrada(formData).subscribe({
        next: async () => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess("Registro criado com sucesso");
          this.visible = false;
          this.entradaForm.reset();
          this.getEntradas()
          
        },
        error: async () => {
          this.sharedService.showToastError("Ocorreu algum problema no registro");
        }
      }
          
      );
  } else {
      this.loadingService.dismiss()
      this.sharedService.showToastError("Preencha os campos corretamente");
  }
}



generatePDF (){

  let mainObject:any = this.entradaFiltrada

  const payload = {
    items : mainObject,
    data : this.dataSelect
  }

  this.insumosService.generatePDF(payload)
  
}

calcHandle(){
  if(this.entradaForm.value.quantidade > 0){
    this.calcOn = true
  }else{
    this.calcOn = false
  }
}

calculateTotal(event: any) {
  const form = this.entradaForm.value;
  const inputValue = parseFloat(event); // Converte o valor de entrada para número decimal
  const quantidade = parseFloat(this.entradaForm.value.quantidade); // Converte a quantidade para número decimal
  console.log(quantidade);

  if (quantidade > 0 && inputValue > 0) {
    const valor_pago = inputValue * quantidade;
    this.entradaForm.patchValue({ valor: valor_pago }); // Atualiza apenas o controle 'valor' no formulário com o valor calculado
    console.log(this.entradaForm.value);
  }else{
    this.entradaForm.patchValue({ valor: 0.00 }); // Atualiza apenas o controle 'valor' no formulário com o valor calculado
  }
}




}
